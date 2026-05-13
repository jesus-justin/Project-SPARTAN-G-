import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getContentForStudent,
  getContentDetail,
  createContent,
  editContent,
  publishContent,
  archiveContent,
  getSafetyPlan,
  upsertSafetyPlan,
} from '../controllers/ginhawa.controller.js';

const router = Router();

router.use(requireAuth);

// Content endpoints
router.get('/content', getContentForStudent);
router.get('/content/:id', getContentDetail);
router.post('/content', createContent);
router.patch('/content/:id', editContent);
router.patch('/content/:id/publish', publishContent);
router.delete('/content/:id', archiveContent);

// Safety plan endpoints
router.get('/safety-plan', getSafetyPlan);
router.post('/safety-plan', upsertSafetyPlan);

export default router;
