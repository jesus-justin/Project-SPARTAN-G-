import { Router } from 'express';
import { getNotifications, acknowledgeNotification, getStudent, streamDashboardUpdates } from '../controllers/ogc.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/stream', requireAuth, streamDashboardUpdates);
router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/:id/acknowledge', requireAuth, acknowledgeNotification);
router.get('/students/:id', requireAuth, getStudent);

export default router;
