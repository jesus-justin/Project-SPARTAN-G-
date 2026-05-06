import { query } from '../config/db.js';
import { evaluateCssrs } from '../services/cssrs.service.js';

export async function submitCssrs(req, res, next) {
  try {
    const evaluation = evaluateCssrs(req.body || {});

    const result = await query(
      `INSERT INTO cssrs_assessments
       (user_id, item1, item2, item3, item4, item5, risk_level, rationale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        req.user.id,
        evaluation.answers.item1,
        evaluation.answers.item2,
        evaluation.answers.item3,
        evaluation.answers.item4,
        evaluation.answers.item5,
        evaluation.riskLevel,
        evaluation.rationale,
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        assessmentId: result.rows[0].id,
        submittedAt: result.rows[0].created_at,
        riskLevel: evaluation.riskLevel,
        rationale: evaluation.rationale,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getLatestCssrs(req, res, next) {
  try {
    const result = await query(
      `SELECT id, item1, item2, item3, item4, item5, risk_level, rationale, created_at
       FROM cssrs_assessments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'No C-SSRS records found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}
