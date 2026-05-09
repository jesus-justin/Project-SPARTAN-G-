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

    // latest DASS-21 risk (for currentRisk) + latest assessment timestamps
    const dassRes = await query(
      `SELECT depression_score, anxiety_score, stress_score, total_score, risk_level, created_at
       FROM dass21_assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    const dassRow = dassRes.rowCount > 0 ? dassRes.rows[0] : null;

    // last 7 days aggregated ESM checkins (group by date)
    const esm7Res = await query(
      `SELECT DATE(created_at) AS date, AVG(mood) AS mood, AVG(energy) AS energy
       FROM esm_checkins
       WHERE user_id = $1 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    const last7Days = (esm7Res.rows || []).map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().slice(0,10) : `${r.date}`,
      mood: r.mood !== null ? Number(parseFloat(r.mood).toFixed(1)) : null,
      energy: r.energy !== null ? Number(parseFloat(r.energy).toFixed(1)) : null,
    }));

    // rolling averages for 7/14/30 days
    const rolling7 = await query(
      `SELECT AVG(mood) AS mood, AVG(energy) AS energy FROM esm_checkins WHERE user_id = $1 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [req.user.id]
    );
    const rolling14 = await query(
      `SELECT AVG(mood) AS mood, AVG(energy) AS energy FROM esm_checkins WHERE user_id = $1 AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)`,
      [req.user.id]
    );
    const rolling30 = await query(
      `SELECT AVG(mood) AS mood, AVG(energy) AS energy FROM esm_checkins WHERE user_id = $1 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [req.user.id]
    );

    const rollingAverage7d = rolling7.rowCount > 0 ? {
      mood: rolling7.rows[0].mood !== null ? Number(parseFloat(rolling7.rows[0].mood).toFixed(1)) : null,
      energy: rolling7.rows[0].energy !== null ? Number(parseFloat(rolling7.rows[0].energy).toFixed(1)) : null,
    } : { mood: null, energy: null };

    const rollingAverage14d = rolling14.rowCount > 0 ? {
      mood: rolling14.rows[0].mood !== null ? Number(parseFloat(rolling14.rows[0].mood).toFixed(1)) : null,
      energy: rolling14.rows[0].energy !== null ? Number(parseFloat(rolling14.rows[0].energy).toFixed(1)) : null,
    } : { mood: null, energy: null };

    const rollingAverage30d = rolling30.rowCount > 0 ? {
      mood: rolling30.rows[0].mood !== null ? Number(parseFloat(rolling30.rows[0].mood).toFixed(1)) : null,
      energy: rolling30.rows[0].energy !== null ? Number(parseFloat(rolling30.rows[0].energy).toFixed(1)) : null,
    } : { mood: null, energy: null };

    // latest PHQ-9
    const phqRes = await query(
      `SELECT total_score, severity, submitted_at FROM phq9_responses WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [req.user.id]
    );
    const phqRow = phqRes.rowCount > 0 ? phqRes.rows[0] : null;

    // latest GAD-7
    const gadRes = await query(
      `SELECT total_score, severity, submitted_at FROM gad7_responses WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [req.user.id]
    );
    const gadRow = gadRes.rowCount > 0 ? gadRes.rows[0] : null;

    // risk history (last 5)
    const riskHistRes = await query(
      `SELECT risk_level, created_at FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    );
    const riskHistory = (riskHistRes.rows || []).map((r) => ({ date: r.created_at instanceof Date ? r.created_at.toISOString().slice(0,10) : `${r.created_at}`, riskLevel: r.risk_level }));

    // shap drivers (from latest risk_classifications row)
    const shapRes = await query(
      `SELECT shap_drivers FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    const shapDrivers = shapRes.rowCount > 0 && shapRes.rows[0].shap_drivers ? shapRes.rows[0].shap_drivers : [];

    // compute currentRisk and trajectory from latest risk_classifications if available
    const rcRes = await query(
      `SELECT risk_level, trajectory FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    const currentRisk = rcRes.rowCount > 0 ? rcRes.rows[0].risk_level : (dassRow ? dassRow.risk_level || 'Unknown' : 'Unknown');
    const trajectory = rcRes.rowCount > 0 ? rcRes.rows[0].trajectory || 'Stable' : 'Insufficient Data';

    // helper to compute DASS severity from scaled score
    const dassSeverity = (scaled) => {
      if (scaled <= 9) return 'Normal';
      if (scaled <= 13) return 'Mild';
      if (scaled <= 20) return 'Moderate';
      if (scaled <= 27) return 'Severe';
      return 'Extremely Severe';
    };

    // build latestScores object
    const latestScores = {
      dass21: null,
      phq9: null,
      gad7: null,
    };

    if (dassRow) {
      const depressionScaled = dassRow.depression_score * 2;
      const anxietyScaled = dassRow.anxiety_score * 2;
      const stressScaled = dassRow.stress_score * 2;
      latestScores.dass21 = {
        depression: { raw: dassRow.depression_score, scaled: depressionScaled, severity: dassSeverity(depressionScaled) },
        anxiety: { raw: dassRow.anxiety_score, scaled: anxietyScaled, severity: dassSeverity(anxietyScaled) },
        stress: { raw: dassRow.stress_score, scaled: stressScaled, severity: dassSeverity(stressScaled) },
      };
    }

    if (phqRow) {
      const phqSeverity = phqRow.severity || (phqRow.total_score >= 20 ? 'Severe' : phqRow.total_score >= 15 ? 'Moderately Severe' : phqRow.total_score >= 10 ? 'Moderate' : phqRow.total_score >= 5 ? 'Mild' : 'Minimal');
      latestScores.phq9 = { totalScore: phqRow.total_score, severity: phqSeverity };
    }

    if (gadRow) {
      const gadSeverity = gadRow.severity || (gadRow.total_score >= 15 ? 'Severe' : gadRow.total_score >= 10 ? 'Moderate' : gadRow.total_score >= 5 ? 'Mild' : 'Minimal');
      latestScores.gad7 = { totalScore: gadRow.total_score, severity: gadSeverity };
    }

    return res.json({
      success: true,
      data: {
        student: { name: `${user.first_name} ${user.last_name}`, college: user.college || null, yearLevel: user.year_level || null },
        currentRisk,
        trajectory,
        esmData: {
          last7Days,
          rollingAverage7d,
          rollingAverage14d: rollingAverage14d,
          rollingAverage30d: rollingAverage30d,
        },
        latestScores,
        riskHistory,
        shapDrivers,
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
