import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { submitDass21, getLatestDass21, getDass21Questions } from '../controllers/dass21.controller.js';
import { submitCssrs, getLatestCssrs } from '../controllers/cssrs.controller.js';
import { submitEsm, getRecentEsm } from '../controllers/esm.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/dass21', submitDass21);
router.get('/dass21/questions', getDass21Questions);
router.get('/dass21/latest', getLatestDass21);

router.post('/cssrs', submitCssrs);
router.get('/cssrs/latest', getLatestCssrs);

router.post('/esm', submitEsm);
router.get('/esm/recent', getRecentEsm);

export default router;
