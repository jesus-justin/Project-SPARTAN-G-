import { query } from '../config/db.js';
import { emitOgcEvent, subscribeOgcEvent } from '../services/ogcRealtime.service.js';

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
      `SELECT id, student_id, facilitator_user_id, risk_level, title, body, seen, created_at, updated_at
       FROM ogc_notifications
       ORDER BY created_at DESC`
    );

    return res.json({ success: true, data: result.rows });
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
      `SELECT id, student_id, facilitator_user_id, risk_level, title, body, seen, created_at, updated_at
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
      studentId: sel.rows[0].student_id,
      riskLevel: sel.rows[0].risk_level,
    });

    return res.json({ success: true, data: sel.rows[0] });
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
    const result = await query(
      `SELECT id, student_id, first_name, last_name, year_level, role
       FROM users
       WHERE id = $1 OR student_id = $2
       LIMIT 1`,
      [id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}
