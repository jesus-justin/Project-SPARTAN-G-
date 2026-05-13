import { Router } from 'express';
import { facilitatorLogin, login, me, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', register);
router.post('/signup', register);
router.post('/login', loginRateLimiter, login);
router.post('/facilitator/login', loginRateLimiter, facilitatorLogin);
router.get('/me', requireAuth, me);

export default router;
