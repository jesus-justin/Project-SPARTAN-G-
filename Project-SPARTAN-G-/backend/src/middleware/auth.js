import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, headerToken] = authHeader.split(' ');
  const token = headerToken || req.query.access_token || req.query.token;

  if (scheme !== 'Bearer' || !token) {
    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing or invalid token' });
    }
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.sub,
      studentId: payload.studentId,
      role: payload.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
