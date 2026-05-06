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
