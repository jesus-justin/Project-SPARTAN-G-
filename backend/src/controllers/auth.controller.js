import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;

function toYearLevelNumber(value) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const rounded = Math.trunc(value);
    return rounded >= 1 && rounded <= 5 ? rounded : null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const direct = Number.parseInt(text, 10);
  if (!Number.isNaN(direct) && direct >= 1 && direct <= 5) {
    return direct;
  }

  const map = {
    '1st year': 1,
    '2nd year': 2,
    '3rd year': 3,
    '4th year': 4,
    '5th year': 5,
  };

  return map[text.toLowerCase()] ?? null;
}

function toYearLevelLabel(value) {
  const map = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year',
    5: '5th Year',
  };

  const numeric = Number.parseInt(String(value ?? ''), 10);
  return map[numeric] ?? null;
}

function normalizeSex(value) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const lower = text.toLowerCase();
  if (lower === 'male' || lower === 'm') {
    return 'M';
  }
  if (lower === 'female' || lower === 'f') {
    return 'F';
  }
  if (lower === 'prefer not to say' || lower === 'p' || lower === 'n') {
    return 'P';
  }

  return null;
}

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
    const { studentId, password, name, firstName, lastName, college, yearLevel, program, sex } = req.body;

    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';

    let resolvedFirstName = normalizedFirstName;
    let resolvedLastName = normalizedLastName;

    if ((!resolvedFirstName || !resolvedLastName) && normalizedName) {
      const parts = normalizedName.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        resolvedFirstName = parts[0];
        resolvedLastName = parts[0];
      } else {
        resolvedFirstName = parts.shift();
        resolvedLastName = parts.join(' ');
      }
    }

    if (!studentId || !password || !resolvedFirstName || !resolvedLastName) {
      return res.status(400).json({
        success: false,
        message: 'studentId, password, and either name or firstName/lastName are required',
      });
    }

    const existing = await query('SELECT id FROM users WHERE student_id = $1', [studentId]);

    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Student ID already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const yearLevelNumber = toYearLevelNumber(yearLevel);
    const normalizedCollege = typeof college === 'string' && college.trim() ? college.trim() : null;
    const normalizedProgram = typeof program === 'string' && program.trim() ? program.trim() : null;
    const normalizedSex = normalizeSex(sex);

    const inserted = await query(
      `INSERT INTO users (student_id, password_hash, first_name, last_name, college, year_level, program, sex)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, student_id, first_name, last_name, college, year_level, program, sex, role, created_at`,
      [studentId, passwordHash, resolvedFirstName, resolvedLastName, normalizedCollege, yearLevelNumber, normalizedProgram, normalizedSex]
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
          college: user.college,
          yearLevel: toYearLevelLabel(user.year_level),
          program: user.program,
          sex: user.sex,
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
      `SELECT id, student_id, password_hash, first_name, last_name, college, year_level, program, sex, role
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
          college: user.college,
          yearLevel: toYearLevelLabel(user.year_level),
          program: user.program,
          sex: user.sex,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function facilitatorLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const result = await query(
      `SELECT id, student_id, password_hash, first_name, last_name, college, year_level, program, sex, role
       FROM users
       WHERE student_id = $1 AND role = $2`,
      [email, 'facilitator']
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid facilitator credentials' });
    }

    const user = result.rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ success: false, message: 'Invalid facilitator credentials' });
    }

    const token = buildToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.student_id,
          firstName: user.first_name,
          lastName: user.last_name,
          college: user.college,
          yearLevel: toYearLevelLabel(user.year_level),
          program: user.program,
          sex: user.sex,
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
      `SELECT id, student_id, first_name, last_name, college, year_level, program, sex, role, created_at
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
        college: user.college,
        yearLevel: toYearLevelLabel(user.year_level),
        program: user.program,
        sex: user.sex,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}
