import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = Router();

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, student_id, first_name, last_name, year_level, role, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.post('/consent', requireAuth, async (req, res, next) => {
  try {
    const { accepted } = req.body;

    if (typeof accepted !== 'boolean') {
      return res.status(400).json({ success: false, message: 'accepted must be boolean' });
    }

    // Ensure table exists
    await query(
      `CREATE TABLE IF NOT EXISTS student_consents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        accepted TINYINT(1) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      []
    );

    await query(
      `INSERT INTO student_consents (user_id, accepted) VALUES ($1, $2)`,
      [req.user.id, accepted ? 1 : 0]
    );

    return res.json({ success: true, message: 'Consent recorded' });
  } catch (error) {
    return next(error);
  }
});

export default router;
