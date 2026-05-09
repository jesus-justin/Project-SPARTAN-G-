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

    // build latestScores object and full histories
    const latestScores = { dass21: null, phq9: null, gad7: null };

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

    // fetch full histories
    const dassHistRes = await query(
      `SELECT depression_score, anxiety_score, stress_score, total_score, risk_level, created_at
       FROM dass21_assessments WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.user.id]
    );

    const dassHistory = (dassHistRes.rows || []).map((r) => {
      const dep = r.depression_score != null ? Number(r.depression_score) : null;
      const anx = r.anxiety_score != null ? Number(r.anxiety_score) : null;
      const str = r.stress_score != null ? Number(r.stress_score) : null;
      const depScaled = dep != null ? dep * 2 : null;
      const anxScaled = anx != null ? anx * 2 : null;
      const strScaled = str != null ? str * 2 : null;
      return {
        date: r.created_at instanceof Date ? r.created_at.toISOString().slice(0,10) : `${r.created_at}`,
        depression: depScaled != null ? { scaled: depScaled, severity: dassSeverity(depScaled) } : null,
        anxiety: anxScaled != null ? { scaled: anxScaled, severity: dassSeverity(anxScaled) } : null,
        stress: strScaled != null ? { scaled: strScaled, severity: dassSeverity(strScaled) } : null,
      };
    });

    const phqHistRes = await query(
      `SELECT total_score, severity, submitted_at FROM phq9_responses WHERE user_id = $1 ORDER BY submitted_at ASC`,
      [req.user.id]
    );
    const phqHistory = (phqHistRes.rows || []).map((r) => ({ date: r.submitted_at instanceof Date ? r.submitted_at.toISOString().slice(0,10) : `${r.submitted_at}`, totalScore: r.total_score, severity: r.severity || null }));

    const gadHistRes = await query(
      `SELECT total_score, severity, submitted_at FROM gad7_responses WHERE user_id = $1 ORDER BY submitted_at ASC`,
      [req.user.id]
    );
    const gadHistory = (gadHistRes.rows || []).map((r) => ({ date: r.submitted_at instanceof Date ? r.submitted_at.toISOString().slice(0,10) : `${r.submitted_at}`, totalScore: r.total_score, severity: r.severity || null }));

    // helper functions for descriptions
    const anySeverityInDass = (entries, level) => entries.some((e) => {
      if (!e) return false;
      const sevList = [e.depression?.severity, e.anxiety?.severity, e.stress?.severity].filter(Boolean);
      return sevList.some((s) => s === level);
    });

    const computeDassDescription = (history, latest) => {
      if (!latest) return 'No DASS-21 data yet.';
      if (anySeverityInDass([latest], 'Extremely Severe')) return 'Your results are concerning. Please contact OGC immediately for assistance.';
      if (anySeverityInDass([latest], 'Severe')) return 'Your results show severe subscale levels. Please reach out to OGC for support.';
      if (anySeverityInDass([latest], 'Moderate')) return 'Your results indicate moderate subscale levels. We recommend scheduling a check-in with OGC.';
      if (anySeverityInDass([latest], 'Mild')) return 'Your results show mild levels. Consider using the wellness resources available.';
      return 'Your DASS-21 results are within normal ranges. Continue monitoring your wellbeing.';
    };

    const computePhqDescription = (score) => {
      if (score == null) return 'No PHQ-9 data yet.';
      if (score >= 20) return 'Your PHQ-9 score indicates severe depression. Please contact OGC immediately.';
      if (score >= 15) return 'Your PHQ-9 score indicates moderately severe depression. Please schedule an OGC appointment.';
      if (score >= 10) return 'Your PHQ-9 score indicates moderate depression. We recommend speaking with an OGC counsellor.';
      if (score >= 5) return 'Your PHQ-9 score suggests mild depression. Consider trying the wellness resources in GINHAWA.';
      return 'Your PHQ-9 score suggests minimal depression symptoms. Keep up your self-care routines.';
    };

    const computeGadDescription = (score) => {
      if (score == null) return 'No GAD-7 data yet.';
      if (score >= 15) return 'Your results show severe anxiety. Please reach out to OGC for immediate support.';
      if (score >= 10) return 'Your results indicate moderate anxiety. Consider speaking with an OGC counsellor.';
      if (score >= 5) return 'Your results show mild anxiety. Try the breathing exercises in Wellness Resources.';
      return 'Your anxiety levels are minimal. Continue your current self-care practices.';
    };

    // general summary
    const totalAssessmentsTaken = (dassHistRes.rowCount || 0) + (phqHistRes.rowCount || 0) + (gadHistRes.rowCount || 0);
    const lastAssessedDates = [];
    if (dassHistRes.rowCount > 0) lastAssessedDates.push(dassHistRes.rows[dassHistRes.rowCount-1].created_at);
    if (phqHistRes.rowCount > 0) lastAssessedDates.push(phqHistRes.rows[phqHistRes.rowCount-1].submitted_at);
    if (gadHistRes.rowCount > 0) lastAssessedDates.push(gadHistRes.rows[gadHistRes.rowCount-1].submitted_at);
    const lastAssessedDate = lastAssessedDates.length > 0 ? (new Date(Math.max.apply(null, lastAssessedDates.map(d => new Date(d).getTime())))).toISOString().slice(0,10) : null;

    // determine overall status
    let overallStatus = 'Your overall mental health indicators are within healthy ranges.';
    if (currentRisk === 'Crisis' || anySeverityInDass([dassHistory[dassHistory.length-1]], 'Extremely Severe')) {
      overallStatus = 'Your wellbeing is our priority. Please contact OGC immediately or call NCMH: 1553.';
    } else {
      const anySevere = (latestScores.phq9 && (latestScores.phq9.totalScore >= 15)) || (latestScores.gad7 && latestScores.gad7.totalScore >= 15) || anySeverityInDass([dassHistory[dassHistory.length-1]], 'Severe');
      const anyModerate = (latestScores.phq9 && latestScores.phq9.totalScore >= 10) || (latestScores.gad7 && latestScores.gad7.totalScore >= 10) || anySeverityInDass([dassHistory[dassHistory.length-1]], 'Moderate');
      if (anySevere) overallStatus = 'Your assessments indicate you may need support. Please reach out to OGC.';
      else if (anyModerate) overallStatus = 'Some areas of your mental health need attention. Consider using the wellness resources.';
    }

    // DASS description
    const dassLatest = dassHistory.length > 0 ? dassHistory[dassHistory.length-1] : null;
    const dassDescription = computeDassDescription(dassHistory, dassLatest);

    // PHQ description
    const phqLatestScore = phqHistory.length > 0 ? phqHistory[phqHistory.length-1].totalScore : null;
    const phqDescription = computePhqDescription(phqLatestScore);

    // GAD description
    const gadLatestScore = gadHistory.length > 0 ? gadHistory[gadHistory.length-1].totalScore : null;
    const gadDescription = computeGadDescription(gadLatestScore);

    // ESM description
    const esmHasData = Array.isArray(last7Days) && last7Days.length > 0;
    const esmAvgMood = rollingAverage7d.mood;
    let esmDescription = 'No check-in data yet.';
    if (esmHasData) {
      if (esmAvgMood == null) esmDescription = 'No check-in data yet.';
      else if (esmAvgMood >= 7) esmDescription = 'Your mood has been consistently good over the past 7 days. Keep it up!';
      else if (esmAvgMood >= 4) esmDescription = 'Your mood has been moderate recently. Try daily wellness activities to improve your wellbeing.';
      else esmDescription = 'Your mood has been low recently. We recommend reaching out to OGC for support.';
    }

    const generalSummary = {
      hasData: totalAssessmentsTaken > 0 || esmHasData,
      overallStatus,
      description: overallStatus,
      lastAssessedDate,
      totalAssessmentsTaken,
    };

    const responseData = {
      student: { name: `${user.first_name} ${user.last_name}`, college: user.college || null, yearLevel: user.year_level || null, program: user.program || null },
      currentRisk,
      trajectory,
      generalSummary,
      dass21History: { hasData: dassHistory.length > 0, entries: dassHistory, latest: dassLatest, description: dassDescription },
      phq9History: { hasData: phqHistory.length > 0, entries: phqHistory, latest: phqHistory.length > 0 ? phqHistory[phqHistory.length-1] : null, description: phqDescription },
      gad7History: { hasData: gadHistory.length > 0, entries: gadHistory, latest: gadHistory.length > 0 ? gadHistory[gadHistory.length-1] : null, description: gadDescription },
      esmData: { hasData: esmHasData, last7Days, rollingAverage7d, rollingAverage14d, rollingAverage30d, description: esmDescription },
      latestScores,
      riskHistory,
      shapDrivers,
    };

    return res.json({ success: true, data: responseData });
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
