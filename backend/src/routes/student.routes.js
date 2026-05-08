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


router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    // get student basic info
    const userRes = await query(
      `SELECT id, student_id, first_name, last_name, year_level, role, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const user = userRes.rows[0];

    // check consent
    const consentRes = await query(
      `SELECT accepted FROM student_consents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    const consentFlag = consentRes.rowCount > 0 ? Boolean(consentRes.rows[0].accepted) : false;

    // latest DASS-21 risk
    const dassRes = await query(
      `SELECT risk_level FROM dass21_assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    const riskLevel = dassRes.rowCount > 0 ? dassRes.rows[0].risk_level : 'Unknown';

    // last 7 ESM checkins
    const esmRes = await query(
      `SELECT mood, energy, created_at FROM esm_checkins WHERE user_id = $1 ORDER BY created_at DESC LIMIT 7`,
      [req.user.id]
    );
    const esmRows = esmRes.rows || [];
    const esm = esmRows.map((r) => ({ mood: r.mood, energy: r.energy, createdAt: r.created_at })).reverse();

    return res.json({
      success: true,
      data: {
        name: `${user.first_name} ${user.last_name}`,
        riskLevel,
        consentFlag,
        esm,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/trajectory', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT trajectory, mood_slope, energy_slope FROM risk_classifications
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.json({ success: true, data: { trajectory: 'Insufficient Data', moodSlope: 0, energySlope: 0 } });
    }

    const data = result.rows[0];
    return res.json({
      success: true,
      data: {
        trajectory: data.trajectory,
        moodSlope: data.mood_slope,
        energySlope: data.energy_slope,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
