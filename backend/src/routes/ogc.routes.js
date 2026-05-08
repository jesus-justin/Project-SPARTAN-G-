import { Router } from 'express';
import { getNotifications, acknowledgeNotification, getStudent } from '../controllers/ogc.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// OGC notifications (requires facilitator auth in production; keep requireAuth for now)
router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/:id/acknowledge', requireAuth, acknowledgeNotification);

// Student lookup for OGC views
router.get('/students/:id', requireAuth, getStudent);

export default router;
import { Router } from 'express';
import { listHotlines } from '../controllers/ogc.controller.js';

const router = Router();

router.get('/hotlines', listHotlines);

export default router;
