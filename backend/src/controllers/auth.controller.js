import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;

function buildToken(user) {
  return jwt.sign(
    {
      studentId: user.student_id,
      role: user.role,
    },
    env.jwtSecret,
    {
      subject: String(user.id),
      expiresIn: env.jwtExpiresIn,
    }
  );
}

export async function register(req, res, next) {
  try {
    const { studentId, password, firstName, lastName, yearLevel } = req.body;

    if (!studentId || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'studentId, password, firstName, and lastName are required',
      });
    }

    const existing = await query('SELECT id FROM users WHERE student_id = $1', [studentId]);

    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Student ID already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const inserted = await query(
      `INSERT INTO users (student_id, password_hash, first_name, last_name, year_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, first_name, last_name, year_level, role, created_at`,
      [studentId, passwordHash, firstName, lastName, yearLevel ?? null]
    );

    const user = inserted.rows[0];
    const token = buildToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          studentId: user.student_id,
          firstName: user.first_name,
          lastName: user.last_name,
          yearLevel: user.year_level,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ success: false, message: 'studentId and password are required' });
    }

    const result = await query(
      `SELECT id, student_id, password_hash, first_name, last_name, year_level, role
       FROM users
       WHERE student_id = $1`,
      [studentId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = buildToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          studentId: user.student_id,
          firstName: user.first_name,
          lastName: user.last_name,
          yearLevel: user.year_level,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const result = await query(
      `SELECT id, student_id, first_name, last_name, year_level, role, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: user.id,
        studentId: user.student_id,
        firstName: user.first_name,
        lastName: user.last_name,
        yearLevel: user.year_level,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}
