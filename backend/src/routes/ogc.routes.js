import { Router } from 'express';
import { listHotlines } from '../controllers/ogc.controller.js';

const router = Router();

router.get('/hotlines', listHotlines);

export default router;
