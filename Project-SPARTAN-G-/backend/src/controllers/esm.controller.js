import { query } from '../config/db.js';

export async function submitEsm(req, res, next) {
  try {
    const { mood, energy, stress, note } = req.body;

    const valuesToValidate = [mood, energy, stress];
    const validRange = valuesToValidate.every((v) => Number.isInteger(v) && v >= 1 && v <= 5);

    if (!validRange) {
      return res.status(400).json({
        success: false,
        message: 'mood, energy, and stress must be integers between 1 and 5',
      });
    }

    const result = await query(
      `INSERT INTO esm_checkins (user_id, mood, energy, stress, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [req.user.id, mood, energy, stress, note ?? null]
    );

    return res.status(201).json({
      success: true,
      data: {
        checkinId: result.rows[0].id,
        submittedAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getRecentEsm(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit || 7), 30);

    const result = await query(
      `SELECT id, mood, energy, stress, note, created_at
       FROM esm_checkins
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return next(error);
  }
}
