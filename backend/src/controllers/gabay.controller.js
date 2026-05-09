import { query } from '../config/db.js';
import crypto from 'crypto';

export async function getPopulationDashboard(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const riskLevels = ['Low', 'Moderate', 'High', 'Crisis'];
    const emptyRiskCounts = () => ({ Low: 0, Moderate: 0, High: 0, Crisis: 0 });

    function normalizeRiskLevel(level) {
      return riskLevels.includes(level) ? level : 'Unknown';
    }

    async function getWindowSummary(days) {
      const result = await query(
        `SELECT rc.risk_level, COUNT(*) AS count
         FROM risk_classifications rc
         INNER JOIN (
           SELECT user_id, MAX(created_at) AS latest_created_at
           FROM risk_classifications
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
           GROUP BY user_id
         ) latest ON latest.user_id = rc.user_id AND latest.latest_created_at = rc.created_at
         GROUP BY rc.risk_level`,
        []
      );

      const out = emptyRiskCounts();
      for (const row of result.rows) {
        const level = normalizeRiskLevel(String(row.risk_level || '').trim());
        if (level !== 'Unknown') {
          out[level] = Number(row.count || 0);
        }
      }

      return out;
    }

    async function getCohortSummary(groupField, selectExpression) {
      const result = await query(
        `SELECT ${selectExpression} AS cohort,
                SUM(CASE WHEN rc.risk_level = 'Low' THEN 1 ELSE 0 END) AS Low,
                SUM(CASE WHEN rc.risk_level = 'Moderate' THEN 1 ELSE 0 END) AS Moderate,
                SUM(CASE WHEN rc.risk_level = 'High' THEN 1 ELSE 0 END) AS High,
                SUM(CASE WHEN rc.risk_level = 'Crisis' THEN 1 ELSE 0 END) AS Crisis
         FROM risk_classifications rc
         INNER JOIN (
           SELECT user_id, MAX(created_at) AS latest_created_at
           FROM risk_classifications
           GROUP BY user_id
         ) latest ON latest.user_id = rc.user_id AND latest.latest_created_at = rc.created_at
         INNER JOIN users u ON u.id = rc.user_id
         WHERE u.role = 'student'
         GROUP BY cohort
         ORDER BY cohort ASC`,
        []
      );

      return result.rows.map((row) => ({
        [groupField]: row.cohort,
        Low: Number(row.Low || 0),
        Moderate: Number(row.Moderate || 0),
        High: Number(row.High || 0),
        Crisis: Number(row.Crisis || 0),
      }));
    }

    const summary7d = await getWindowSummary(7);
    const summary14d = await getWindowSummary(14);
    const summary30d = await getWindowSummary(30);

    const byCollege = await getCohortSummary('college', "COALESCE(NULLIF(TRIM(u.college), ''), 'Unknown')");
    const byYearLevel = await getCohortSummary('yearLevel', "COALESCE(CAST(u.year_level AS CHAR), 'Unknown')");
    const bySex = await getCohortSummary('sex', "COALESCE(NULLIF(UPPER(TRIM(u.sex)), ''), 'Unknown')");

    const totalStudentsMonitoredRes = await query(
      `SELECT COUNT(DISTINCT rc.user_id) AS count
       FROM risk_classifications rc
       INNER JOIN users u ON u.id = rc.user_id
       WHERE u.role = 'student'`,
      []
    );

    const totalAssessmentsThisMonthRes = await query(
      `SELECT COUNT(*) AS count
       FROM risk_classifications rc
       INNER JOIN users u ON u.id = rc.user_id
       WHERE u.role = 'student'
         AND rc.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
      []
    );

    const shapRowsRes = await query(
      `SELECT rc.shap_drivers
       FROM risk_classifications rc
       INNER JOIN (
         SELECT user_id, MAX(created_at) AS latest_created_at
         FROM risk_classifications
         GROUP BY user_id
       ) latest ON latest.user_id = rc.user_id AND latest.latest_created_at = rc.created_at
       WHERE rc.shap_drivers IS NOT NULL`,
      []
    );

    const impactRank = { LOW: 1, MODERATE: 2, HIGH: 3 };
    const impactByFeature = new Map();

    for (const row of shapRowsRes.rows || []) {
      let drivers = [];
      try {
        drivers = Array.isArray(row.shap_drivers) ? row.shap_drivers : JSON.parse(row.shap_drivers || '[]');
      } catch {
        drivers = [];
      }

      for (const driver of drivers) {
        const feature = String(driver.feature || 'Unknown').trim();
        const impact = String(driver.impact || 'LOW').toUpperCase();
        const current = impactByFeature.get(feature) || { feature, impactScoreSum: 0, count: 0 };
        current.impactScoreSum += impactRank[impact] || 1;
        current.count += 1;
        impactByFeature.set(feature, current);
      }
    }

    const topShapDrivers = [...impactByFeature.values()]
      .map((item) => {
        const avgScore = item.count > 0 ? item.impactScoreSum / item.count : 0;
        const avgImpact = avgScore >= 2.5 ? 'HIGH' : avgScore >= 1.5 ? 'MODERATE' : 'LOW';
        return {
          feature: item.feature,
          avgImpact,
          count: item.count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return res.json({
      success: true,
      data: {
        summary_7d: summary7d,
        summary_14d: summary14d,
        summary_30d: summary30d,
        byCollege,
        byYearLevel,
        bySex,
        topShapDrivers,
        totalStudentsMonitored: Number(totalStudentsMonitoredRes.rows?.[0]?.count || 0),
        totalAssessmentsThisMonth: Number(totalAssessmentsThisMonthRes.rows?.[0]?.count || 0),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getNotifications(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const result = await query(
      `SELECT 
        n.id, n.student_id, n.facilitator_user_id, n.risk_level, n.title, n.body, 
        n.seen, n.created_at, n.updated_at,
        rc.shap_drivers, rc.trajectory
       FROM ogc_notifications n
       LEFT JOIN risk_classifications rc ON rc.user_id = n.student_id
       ORDER BY n.created_at DESC`,
      []
    );

    const notifications = result.rows.map((row) => ({
      id: row.id,
      studentId: row.student_id,
      facilitatorUserId: row.facilitator_user_id,
      riskLevel: row.risk_level,
      title: row.title,
      body: row.body,
      seen: Boolean(row.seen),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      shapDrivers: row.shap_drivers ? JSON.parse(row.shap_drivers) : [],
      trajectory: row.trajectory,
    }));

    return res.json({ success: true, data: notifications });
  } catch (error) {
    return next(error);
  }
}

export async function acknowledgeNotification(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    const result = await query(
      `UPDATE ogc_notifications SET seen = 1, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = await query(
      `SELECT id, student_id, risk_level, title, body, seen, created_at, updated_at
       FROM ogc_notifications WHERE id = $1`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        id: updated.rows[0].id,
        studentId: updated.rows[0].student_id,
        riskLevel: updated.rows[0].risk_level,
        title: updated.rows[0].title,
        body: updated.rows[0].body,
        seen: Boolean(updated.rows[0].seen),
        createdAt: updated.rows[0].created_at,
        updatedAt: updated.rows[0].updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentDetail(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    const userRes = await query(
      `SELECT id, student_id, first_name, last_name, year_level FROM users WHERE id = $1`,
      [id]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = userRes.rows[0];

    // Get latest risk classification
    const riskRes = await query(
      `SELECT risk_level, dass21_score, phq9_score, gad7_score, trajectory, shap_drivers
       FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    const riskData = riskRes.rowCount > 0 ? riskRes.rows[0] : null;

    // Get appointments
    const apptRes = await query(
      `SELECT appointment_id, scheduled_at, status, notes FROM appointments
       WHERE user_id = $1 ORDER BY scheduled_at DESC`,
      [id]
    );

    const data = {
      id: student.id,
      studentId: student.student_id,
      firstName: student.first_name,
      lastName: student.last_name,
      yearLevel: student.year_level,
      currentRiskLevel: riskData ? riskData.risk_level : 'Unknown',
      scores: riskData
        ? {
            dass21: riskData.dass21_score,
            phq9: riskData.phq9_score,
            gad7: riskData.gad7_score,
          }
        : {},
      trajectory: riskData ? riskData.trajectory : 'Insufficient Data',
      shapDrivers: riskData ? JSON.parse(riskData.shap_drivers || '[]') : [],
      appointments: apptRes.rows.map((a) => ({
        appointmentId: a.appointment_id,
        scheduledAt: a.scheduled_at,
        status: a.status,
        notes: a.notes,
      })),
    };

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function createAppointment(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { studentId, scheduledAt, notes } = req.body;

    if (!studentId || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'studentId and scheduledAt are required' });
    }

    // Accept either numeric user id or student_id string
    const studentRes = await query(
      `SELECT id, student_id FROM users WHERE id = $1 OR student_id = $2 LIMIT 1`,
      [studentId, studentId]
    );

    if (studentRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const resolvedUserId = studentRes.rows[0].id;
    const resolvedStudentId = studentRes.rows[0].student_id;

    // Get current risk level
    const riskRes = await query(
      `SELECT risk_level FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [resolvedUserId]
    );

    const riskLevel = riskRes.rowCount > 0 ? riskRes.rows[0].risk_level : null;
    const appointmentId = crypto.randomUUID();

    await query(
      `INSERT INTO appointments
       (appointment_id, user_id, student_id, facilitator_id, scheduled_at, status, notes, risk_level_at_booking, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, NOW())`,
      [appointmentId, resolvedUserId, resolvedStudentId, req.user.id, scheduledAt, notes || null, riskLevel]
    );

    return res.status(201).json({
      success: true,
      data: {
        appointmentId,
        studentId: resolvedStudentId,
        scheduledAt,
        status: 'pending',
        notes,
        riskLevelAtBooking: riskLevel,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAppointments(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const result = await query(
      `SELECT appointment_id, user_id, facilitator_id, scheduled_at, status, notes, risk_level_at_booking, created_at
       FROM appointments
       ORDER BY scheduled_at DESC`,
      []
    );

    const appointments = result.rows.map((row) => ({
      appointmentId: row.appointment_id,
      studentId: row.user_id,
      facilitatorId: row.facilitator_id,
      scheduledAt: row.scheduled_at,
      status: row.status,
      notes: row.notes,
      riskLevelAtBooking: row.risk_level_at_booking,
      createdAt: row.created_at,
    }));

    return res.json({ success: true, data: appointments });
  } catch (error) {
    return next(error);
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await query(
      `UPDATE appointments SET status = $1 WHERE appointment_id = $2`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const updated = await query(
      `SELECT appointment_id, user_id, facilitator_id, scheduled_at, status, notes, risk_level_at_booking, created_at
       FROM appointments WHERE appointment_id = $1`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        appointmentId: updated.rows[0].appointment_id,
        studentId: updated.rows[0].user_id,
        facilitatorId: updated.rows[0].facilitator_id,
        scheduledAt: updated.rows[0].scheduled_at,
        status: updated.rows[0].status,
        notes: updated.rows[0].notes,
        riskLevelAtBooking: updated.rows[0].risk_level_at_booking,
        createdAt: updated.rows[0].created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}
