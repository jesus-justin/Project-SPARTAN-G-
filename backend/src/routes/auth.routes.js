import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.get('/me', requireAuth, me);

export default router;
