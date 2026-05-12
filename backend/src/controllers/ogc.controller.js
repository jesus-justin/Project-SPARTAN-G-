import { query } from '../config/db.js';
import { emitOgcEvent, subscribeOgcEvent } from '../services/ogcRealtime.service.js';
import crypto from 'crypto';

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

function buildCaseId(notificationId, createdAt) {
  const year = new Date(createdAt || Date.now()).getFullYear();
  const sequence = String(Number(notificationId) || 0).padStart(3, '0');
  return `CASE-${year}-${sequence}`;
}

function formatTimeAgo(value) {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export async function getNotifications(_req, res, next) {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS ogc_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        facilitator_user_id INT NULL,
        risk_level VARCHAR(32) NULL,
        title VARCHAR(255),
        body TEXT,
        seen TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );

    const result = await query(
      `SELECT id, facilitator_user_id, risk_level, title, body, seen, created_at, updated_at
       FROM ogc_notifications
       ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      data: result.rows.map((row) => ({
        notif_id: crypto.randomUUID?.() || `${row.id}`,
        caseId: buildCaseId(row.id, row.created_at),
        riskLevel: row.risk_level || 'Low',
        assessmentType: /PHQ-9|GAD-7|DASS-21/i.test(`${row.title} ${row.body}`) ? `${String(row.title || '').split(' - ').pop() || 'Assessment Summary'}` : 'Assessment Summary',
        score: 0,
        timeAgo: formatTimeAgo(row.created_at),
        isAnonymized: true,
        acknowledgedAt: row.seen ? row.updated_at : null,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function acknowledgeNotification(req, res, next) {
  try {
    const { id } = req.params;
    await query(
      `UPDATE ogc_notifications SET seen = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    const sel = await query(
      `SELECT id, facilitator_user_id, risk_level, title, body, seen, created_at, updated_at
       FROM ogc_notifications
       WHERE id = $1`,
      [id]
    );

    if (sel.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    emitOgcEvent('dashboard-updated', {
      source: 'notification-acknowledged',
      notificationId: sel.rows[0].id,
      riskLevel: sel.rows[0].risk_level,
    });

    return res.json({
      success: true,
      data: {
        notif_id: crypto.randomUUID?.() || `${sel.rows[0].id}`,
        caseId: buildCaseId(sel.rows[0].id, sel.rows[0].created_at),
        riskLevel: sel.rows[0].risk_level || 'Low',
        assessmentType: 'Assessment Summary',
        score: 0,
        timeAgo: formatTimeAgo(sel.rows[0].created_at),
        isAnonymized: true,
        acknowledgedAt: sel.rows[0].updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export function streamDashboardUpdates(req, res) {
  if (req.user.role !== 'facilitator') {
    return res.status(403).json({ success: false, message: 'Facilitator access required' });
  }

  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, timestamp: new Date().toISOString() })}\n\n`);

  const sendHeartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 25000);

  const unsubscribe = subscribeOgcEvent('dashboard-updated', (payload) => {
    res.write(`event: dashboard-updated\ndata: ${JSON.stringify(payload)}\n\n`);
  });

  req.on('close', () => {
    clearInterval(sendHeartbeat);
    unsubscribe();
    res.end();
  });
}

export async function getStudent(req, res, next) {
  try {
    const { id } = req.params;
    const notificationResult = await query(
      `SELECT n.id, n.student_id, n.risk_level, n.created_at,
              u.id AS user_id, u.student_id AS studentCode, u.first_name, u.last_name, u.college, u.year_level, u.program, u.sex
       FROM ogc_notifications n
       INNER JOIN users u ON u.id = n.student_id
       WHERE CONCAT('CASE-', YEAR(n.created_at), '-', LPAD(n.id, 3, '0')) = $1 OR n.id = $1 OR u.id = $1
       ORDER BY n.created_at DESC
       LIMIT 1`,
      [id]
    );

    if (notificationResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const selected = notificationResult.rows[0];
    if ((selected.risk_level || '').toLowerCase() !== 'crisis') {
      throw new ForbiddenError('Identity only revealed for Crisis cases');
    }

    return res.json({
      success: true,
      data: {
        id: selected.user_id,
        studentId: selected.studentCode,
        firstName: selected.first_name,
        lastName: selected.last_name,
        college: selected.college,
        yearLevel: selected.year_level,
        program: selected.program,
        sex: selected.sex,
        currentRiskLevel: selected.risk_level,
        caseId: buildCaseId(selected.id, selected.created_at),
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
}
