import { query } from '../config/db.js';
import crypto from 'crypto';

export async function getPopulationDashboard(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    // Get risk distribution
    const riskDist = await query(
      `SELECT risk_level, COUNT(*) as count FROM dass21_assessments
       GROUP BY risk_level
       ORDER BY created_at DESC`,
      []
    );

    const riskDistribution = {};
    riskDist.rows.forEach((row) => {
      riskDistribution[row.risk_level] = row.count;
    });

    // Get by college
    const byCollege = await query(
      `SELECT year_level, COUNT(*) as count FROM users
       WHERE role = 'student'
       GROUP BY year_level`,
      []
    );

    const collegeBreakdown = {};
    byCollege.rows.forEach((row) => {
      collegeBreakdown[row.year_level] = row.count;
    });

    // Total students
    const totalRes = await query(
      `SELECT COUNT(*) as total FROM users WHERE role = 'student'`,
      []
    );
    const totalStudents = totalRes.rows[0].total;

    // 7-day, 14-day, 30-day summaries
    const summaries = {};
    for (const days of [7, 14, 30]) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const res7 = await query(
        `SELECT COUNT(*) as count FROM dass21_assessments
         WHERE created_at >= $1`,
        [dateThreshold]
      );
      summaries[`summary_${days}d`] = res7.rows[0].count;
    }

    return res.json({
      success: true,
      data: {
        totalStudentsMonitored: totalStudents,
        riskDistribution,
        collegeBreakdown,
        rollingWindowSummaries: summaries,
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

    // Get student info
    const studentRes = await query(`SELECT id FROM users WHERE id = $1`, [studentId]);

    if (studentRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get current risk level
    const riskRes = await query(
      `SELECT risk_level FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [studentId]
    );

    const riskLevel = riskRes.rowCount > 0 ? riskRes.rows[0].risk_level : null;
    const appointmentId = crypto.randomUUID();

    await query(
      `INSERT INTO appointments
       (appointment_id, user_id, student_id, facilitator_id, scheduled_at, status, notes, risk_level_at_booking, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, NOW())`,
      [appointmentId, studentId, null, req.user.id, scheduledAt, notes || null, riskLevel]
    );

    return res.status(201).json({
      success: true,
      data: {
        appointmentId,
        studentId,
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
