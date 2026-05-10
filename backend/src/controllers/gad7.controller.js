import { query } from '../config/db.js';
import { scoreGad7, GAD7_QUESTIONS } from '../services/gad7.service.js';
import { classifyComprehensiveRisk } from '../services/riskClassifier.service.js';
import crypto from 'crypto';
import { emitOgcEvent } from '../services/ogcRealtime.service.js';

export async function getGad7Questions(req, res, next) {
  try {
    return res.json({
      success: true,
      data: GAD7_QUESTIONS,
    });
  } catch (error) {
    return next(error);
  }
}

export async function submitGad7(req, res, next) {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length !== 7) {
      return res.status(400).json({
        success: false,
        message: 'answers must be an array of 7 values',
      });
    }

    const scoring = scoreGad7(answers);
    const responseId = crypto.randomUUID();

    // Insert GAD-7 response
    await query(
      `INSERT INTO gad7_responses
       (response_id, user_id, student_id, answers, total_score, severity, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [responseId, req.user.id, req.user.studentId, JSON.stringify(answers), scoring.totalScore, scoring.severity]
    );

    // Get latest DASS-21 score
    const dass21Result = await query(
      `SELECT total_score, depression_score, anxiety_score, stress_score
       FROM dass21_assessments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    // Get latest PHQ-9 score
    const phq9Result = await query(
      `SELECT total_score, severity
       FROM phq9_responses
       WHERE user_id = $1
       ORDER BY submitted_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    // Get latest ESM entries for trajectory
    const esmResult = await query(
      `SELECT mood, energy, created_at
       FROM esm_checkins
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 7`,
      [req.user.id]
    );

    // Calculate comprehensive risk
    const dass21Data = dass21Result.rowCount > 0 ? dass21Result.rows[0] : null;
    const phq9Data = phq9Result.rowCount > 0 ? phq9Result.rows[0] : null;
    const esmData = esmResult.rowCount > 0 ? esmResult.rows : [];

    // Calculate mood/energy slopes
    let moodSlope = 0;
    let energySlope = 0;
    if (esmData.length >= 5) {
      moodSlope = calculateSlope(esmData.map((e) => e.mood));
      energySlope = calculateSlope(esmData.map((e) => e.energy));
    }

    // Determine trajectory
    let trajectory = 'Stable';
    if (esmData.length >= 5 && moodSlope <= -1.5) {
      const avgMood = esmData.reduce((sum, e) => sum + e.mood, 0) / esmData.length;
      if (avgMood >= 5) {
        trajectory = 'At-Risk';
      } else if (moodSlope < 0) {
        trajectory = 'Deteriorating';
      }
    } else if (esmData.length >= 5 && (moodSlope < 0 || energySlope < 0)) {
      trajectory = 'Deteriorating';
    }

    const riskClassification = classifyComprehensiveRisk({
      dass21Score: dass21Data ? dass21Data.total_score : null,
      dass21Subscales: dass21Data
        ? {
            depression: dass21Data.depression_score,
            anxiety: dass21Data.anxiety_score,
            stress: dass21Data.stress_score,
          }
        : {},
      phq9Score: phq9Data ? phq9Data.total_score : null,
      phq9Severity: phq9Data ? phq9Data.severity : null,
      gad7Score: scoring.totalScore,
      gad7Severity: scoring.severity,
      trajectory,
      moodSlope,
      energySlope,
    });

    // Store risk classification
    await query(
      `INSERT INTO risk_classifications
       (user_id, dass21_score, phq9_score, gad7_score, trajectory, risk_level, mood_slope, energy_slope, shap_drivers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        req.user.id,
        dass21Data ? dass21Data.total_score : null,
        phq9Data ? phq9Data.total_score : null,
        scoring.totalScore,
        trajectory,
        riskClassification.riskLevel,
        moodSlope,
        energySlope,
        JSON.stringify(riskClassification.drivers),
      ]
    );

    // Create notification if High or Crisis risk
    if (riskClassification.riskLevel === 'High' || riskClassification.riskLevel === 'Crisis') {
      const facilitatorRes = await query(`SELECT id FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1`, ['facilitator']);
      const facilitatorId = facilitatorRes.rowCount > 0 ? facilitatorRes.rows[0].id : null;

      await query(
        `INSERT INTO ogc_notifications (student_id, facilitator_user_id, risk_level, title, body, seen)
         VALUES ($1, $2, $3, $4, $5, 0)`,
        [
          req.user.id,
          facilitatorId,
          riskClassification.riskLevel,
          `${riskClassification.riskLevel} Risk Alert - GAD-7`,
          `Student ${req.user.studentId} scored ${scoring.totalScore} on GAD-7 (${scoring.severity}) and is classified as ${riskClassification.riskLevel} risk.`,
        ]
      );

      emitOgcEvent('dashboard-updated', {
        source: 'gad7',
        studentId: req.user.id,
        riskLevel: riskClassification.riskLevel,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        responseId,
        submittedAt: new Date().toISOString(),
        scoring,
        riskLevel: riskClassification.riskLevel,
        trajectory,
        drivers: riskClassification.drivers,
      },
    });
  } catch (error) {
    return next(error);
  }
}

function calculateSlope(values) {
  if (values.length < 2) return 0;

  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = values.reduce((sum, _y, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}
