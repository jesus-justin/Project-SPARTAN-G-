import { Router } from 'express';
import { getNotifications, acknowledgeNotification, getStudent } from '../controllers/ogc.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/:id/acknowledge', requireAuth, acknowledgeNotification);
router.get('/students/:id', requireAuth, getStudent);

export default router;
