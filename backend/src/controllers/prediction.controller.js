import axios from 'axios';
import { query } from '../config/db.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * Get predicted risk level for a student
 * Calls ML service for XGBoost prediction with SHAP explainability
 */
export async function getPredictedRisk(req, res, next) {
  try {
    const { userId } = req.params;
    const studentUserId = parseInt(userId);

    if (!studentUserId || studentUserId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    // Call ML service
    let mlResponse;
    try {
      mlResponse = await axios.get(`${ML_SERVICE_URL}/api/predict/student/${studentUserId}`, {
        timeout: 10000,
      });
    } catch (mlError) {
      if (mlError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'ML service unavailable. Using rule-based classification.',
        });
      }
      throw mlError;
    }

    if (!mlResponse.data.success) {
      return res.status(400).json({
        success: false,
        message: mlResponse.data.error,
      });
    }

    // Get student info
    const studentResult = await query(
      `SELECT student_id, first_name, last_name FROM users WHERE id = $1`,
      [studentUserId]
    );

    const student = studentResult.rowCount > 0 ? studentResult.rows[0] : null;

    // Return prediction with metadata
    return res.json({
      success: true,
      student: student
        ? {
            id: studentUserId,
            student_id: student.student_id,
            name: `${student.first_name} ${student.last_name}`,
          }
        : null,
      prediction: mlResponse.data.prediction,
      currentRuleBasedRisk: mlResponse.data.current_rule_based_risk,
      timestamp: mlResponse.data.timestamp,
      source: 'ML Service (XGBoost + SHAP)',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get batch predictions for multiple students
 * Useful for dashboard loading
 */
export async function getPredictionsBatch(req, res, next) {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds must be a non-empty array',
      });
    }

    // Call ML service batch endpoint
    let mlResponse;
    try {
      mlResponse = await axios.post(
        `${ML_SERVICE_URL}/api/predict/batch`,
        { user_ids: userIds },
        { timeout: 30000 }
      );
    } catch (mlError) {
      if (mlError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'ML service unavailable',
        });
      }
      throw mlError;
    }

    if (!mlResponse.data.success) {
      return res.status(400).json({
        success: false,
        message: mlResponse.data.error,
      });
    }

    // Enrich predictions with student info
    const userIdList = userIds.map((id) => `'${id}'`).join(',');
    const studentsResult = await query(
      `SELECT id, student_id, first_name, last_name FROM users WHERE id IN (${userIdList})`
    );

    const studentMap = {};
    studentsResult.rows.forEach((student) => {
      studentMap[student.id] = {
        student_id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
      };
    });

    const enrichedPredictions = mlResponse.data.predictions.map((pred) => ({
      ...pred,
      student: studentMap[pred.user_id] || null,
    }));

    return res.json({
      success: true,
      predictions: enrichedPredictions,
      timestamp: mlResponse.data.timestamp,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get ML service health status
 */
export async function getMlServiceStatus(req, res, next) {
  try {
    let healthResponse;
    try {
      healthResponse = await axios.get(`${ML_SERVICE_URL}/health`, {
        timeout: 5000,
      });
    } catch (error) {
      return res.json({
        success: false,
        message: 'ML service unavailable',
        status: 'disconnected',
      });
    }

    // Get model status
    let modelResponse;
    try {
      modelResponse = await axios.get(`${ML_SERVICE_URL}/api/models/status`, {
        timeout: 5000,
      });
    } catch (error) {
      modelResponse = { data: { models: {} } };
    }

    return res.json({
      success: true,
      service: healthResponse.data,
      models: modelResponse.data.models || {},
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Train ML models (admin only)
 * This should be called periodically or on-demand
 */
export async function trainModels(req, res, next) {
  try {
    // TODO: Add admin authentication check

    let trainResponse;
    try {
      trainResponse = await axios.post(`${ML_SERVICE_URL}/api/train`, {}, { timeout: 300000 });
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: 'ML service unavailable or training failed',
        error: error.message,
      });
    }

    if (!trainResponse.data.success) {
      return res.status(400).json({
        success: false,
        message: trainResponse.data.message,
        error: trainResponse.data.error,
      });
    }

    return res.json({
      success: true,
      message: 'Models trained successfully',
      metrics: trainResponse.data.metrics,
      timestamp: trainResponse.data.timestamp,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Update risk classification with ML prediction
 * Stores ML prediction results in database for tracking
 */
export async function updateRiskWithPrediction(userId, prediction) {
  try {
    const shapDrivers = prediction.shap_drivers || [];

    // Store prediction result
    await query(
      `UPDATE risk_classifications
       SET shap_drivers = $1
       WHERE user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [JSON.stringify(shapDrivers), userId]
    );

    return true;
  } catch (error) {
    console.error(`Error updating risk classification for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get prediction history for a student
 * Returns recent predictions for trend analysis
 */
export async function getPredictionHistory(req, res, next) {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const result = await query(
      `SELECT 
        id, user_id, dass21_score, phq9_score, gad7_score,
        trajectory, risk_level, shap_drivers, created_at
       FROM risk_classifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const predictions = result.rows.map((row) => ({
      ...row,
      shap_drivers: row.shap_drivers ? JSON.parse(row.shap_drivers) : [],
    }));

    return res.json({
      success: true,
      user_id: userId,
      count: predictions.length,
      predictions: predictions,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Explain a specific prediction
 * Returns detailed SHAP values and feature contributions
 */
export async function explainPrediction(req, res, next) {
  try {
    const { userId } = req.params;

    // Get latest risk classification with SHAP drivers
    const result = await query(
      `SELECT 
        id, user_id, dass21_score, phq9_score, gad7_score,
        mood_slope, energy_slope, trajectory, risk_level,
        shap_drivers, created_at
       FROM risk_classifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No prediction found for user',
      });
    }

    const prediction = result.rows[0];
    const shapDrivers = prediction.shap_drivers ? JSON.parse(prediction.shap_drivers) : [];

    // Get student info
    const studentResult = await query(`SELECT first_name, last_name, student_id FROM users WHERE id = $1`, [userId]);
    const student = studentResult.rowCount > 0 ? studentResult.rows[0] : null;

    return res.json({
      success: true,
      student: student,
      prediction_metadata: {
        prediction_id: prediction.id,
        user_id: prediction.user_id,
        risk_level: prediction.risk_level,
        trajectory: prediction.trajectory,
        created_at: prediction.created_at,
      },
      assessment_scores: {
        dass21_score: prediction.dass21_score,
        phq9_score: prediction.phq9_score,
        gad7_score: prediction.gad7_score,
        mood_slope: prediction.mood_slope,
        energy_slope: prediction.energy_slope,
      },
      shap_drivers: shapDrivers,
      interpretation: generateInterpretation(shapDrivers, prediction),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Generate human-readable interpretation of SHAP drivers
 */
function generateInterpretation(shapDrivers, prediction) {
  const drivers = shapDrivers.slice(0, 3);
  const riskLevel = prediction.risk_level;

  let interpretation = `Student is classified as ${riskLevel} risk. `;

  if (drivers.length > 0) {
    interpretation += 'Key contributing factors: ';
    const factors = drivers.map((d) => `${d.feature} (${d.contribution})`).join(', ');
    interpretation += factors + '.';
  }

  if (riskLevel === 'Crisis' || riskLevel === 'High') {
    interpretation += ' Immediate intervention and close monitoring recommended.';
  } else if (riskLevel === 'Moderate') {
    interpretation += ' Regular follow-ups and monitoring advised.';
  }

  return interpretation;
}
