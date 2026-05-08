import { query } from '../config/db.js';

export async function getNotifications(_req, res, next) {
  try {
    // Ensure table exists (MySQL)
    await query(
      `CREATE TABLE IF NOT EXISTS ogc_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        title VARCHAR(255),
        body TEXT,
        seen TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );

    const result = await query(
      `SELECT id, student_id, title, body, seen, created_at, updated_at
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
    const result = await query(
      `UPDATE ogc_notifications SET seen = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    // Return the updated notification (if exists)
    const sel = await query(`SELECT id, student_id, title, body, seen, created_at, updated_at FROM ogc_notifications WHERE id = $1`, [id]);
    if (sel.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true, data: sel.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function getStudent(req, res, next) {
  try {
    const { id } = req.params;
    // allow either numeric id or student_id string
    const result = await query(
      `SELECT id, student_id, first_name, last_name, year_level, role
       FROM users
       WHERE id = $1 OR student_id = $1
       LIMIT 1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}
import { query } from '../config/db.js';

export async function listHotlines(_req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, phone, description, is_24_7
       FROM ogc_hotlines
       WHERE is_active = $1
       ORDER BY id ASC`,
      [true]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return next(error);
  }
}
