import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPredictedRisk,
  getPredictionsBatch,
  getMlServiceStatus,
  trainModels,
  getPredictionHistory,
  explainPrediction,
} from '../controllers/prediction.controller.js';

const router = express.Router();

/**
 * Prediction Routes
 * Endpoint for getting ML-powered risk predictions with SHAP explanations
 */

// Health check for ML service
router.get('/health', getMlServiceStatus);

// Get predicted risk for single student
router.get('/student/:userId', requireAuth, getPredictedRisk);

// Get batch predictions
router.post('/batch', requireAuth, getPredictionsBatch);

// Get prediction history for tracking trends
router.get('/history/:userId', requireAuth, getPredictionHistory);

// Get detailed explanation of latest prediction
router.get('/explain/:userId', requireAuth, explainPrediction);

// Train models (admin only - TODO: add admin middleware)
router.post('/train', requireAuth, trainModels);

export default router;
