import { query } from '../config/db.js';
import { scoreDASS21 } from '../services/dass21.service.js';
import { classifyDASSRisk } from '../services/riskClassifier.service.js';

export async function submitDass21(req, res, next) {
  try {
    const { answers } = req.body;
    const scoring = scoreDASS21(answers);
    const riskLevel = classifyDASSRisk(scoring);

    const result = await query(
      `INSERT INTO dass21_assessments
       (user_id, answers, depression_score, anxiety_score, stress_score, total_score, risk_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        req.user.id,
        JSON.stringify(answers),
        scoring.depression,
        scoring.anxiety,
        scoring.stress,
        scoring.totalScore,
        riskLevel,
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        assessmentId: result.rows[0].id,
        submittedAt: result.rows[0].created_at,
        scoring,
        riskLevel,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getLatestDass21(req, res, next) {
  try {
    const result = await query(
      `SELECT id, answers, depression_score, anxiety_score, stress_score, total_score, risk_level, created_at
       FROM dass21_assessments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'No DASS-21 records found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}
