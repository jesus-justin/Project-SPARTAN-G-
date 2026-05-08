import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { submitDass21, getLatestDass21, getDass21Questions } from '../controllers/dass21.controller.js';
import { submitCssrs, getLatestCssrs } from '../controllers/cssrs.controller.js';
import { submitEsm, getRecentEsm } from '../controllers/esm.controller.js';
import { submitPhq9, getPhq9Questions } from '../controllers/phq9.controller.js';
import { submitGad7, getGad7Questions } from '../controllers/gad7.controller.js';

const router = Router();

// Public endpoints (no auth required)
router.get('/dass21/questions', getDass21Questions);
router.get('/phq9/questions', getPhq9Questions);
router.get('/gad7/questions', getGad7Questions);

// Protected endpoints (auth required)
router.use(requireAuth);

router.post('/dass21', submitDass21);
router.post('/dass21/submit', submitDass21);
router.get('/dass21/latest', getLatestDass21);

router.post('/cssrs', submitCssrs);
router.post('/cssrs/submit', submitCssrs);
router.get('/cssrs/latest', getLatestCssrs);

router.post('/esm', submitEsm);
router.post('/esm/submit', submitEsm);
router.get('/esm/recent', getRecentEsm);

router.post('/phq9', submitPhq9);
router.post('/phq9/submit', submitPhq9);

router.post('/gad7', submitGad7);
router.post('/gad7/submit', submitGad7);

export default router;
