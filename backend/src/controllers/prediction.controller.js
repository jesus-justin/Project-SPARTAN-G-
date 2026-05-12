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
    const { userIds, features } = req.body;

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
        { userIds, features },
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
    const studentsResult = await query(
      `SELECT id, student_id, first_name, last_name FROM users WHERE id IN (?)`,
      [userIds]
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
 * Get comprehensive analytics report for all students
 * Used by the predictive analytics dashboard
 */
export async function getAnalyticsReport(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const latestRiskSql = `
      SELECT rc.*
      FROM risk_classifications rc
      INNER JOIN (
        SELECT user_id, MAX(created_at) AS latest_created_at
        FROM risk_classifications
        GROUP BY user_id
      ) latest ON latest.user_id = rc.user_id AND latest.latest_created_at = rc.created_at
    `;

    const latestStudentsResult = await query(
      `SELECT
        rc.user_id,
        rc.dass21_score,
        rc.phq9_score,
        rc.gad7_score,
        rc.trajectory,
        rc.risk_level,
        rc.shap_drivers,
        rc.created_at,
        u.college,
        u.year_level,
        u.program,
        da.depression_score AS dass21_depression,
        da.anxiety_score AS dass21_anxiety,
        da.stress_score AS dass21_stress,
        phq.total_score AS phq9_latest_score,
        gad.total_score AS gad7_latest_score,
        esm.avg_mood_7d,
        esm.avg_energy_7d
       FROM (${latestRiskSql}) rc
       JOIN users u ON u.id = rc.user_id
       LEFT JOIN (
         SELECT a1.user_id, a1.depression_score, a1.anxiety_score, a1.stress_score
         FROM dass21_assessments a1
         INNER JOIN (
           SELECT user_id, MAX(created_at) AS latest_created_at
           FROM dass21_assessments
           GROUP BY user_id
         ) latest ON latest.user_id = a1.user_id AND latest.latest_created_at = a1.created_at
       ) da ON da.user_id = rc.user_id
       LEFT JOIN (
         SELECT p1.user_id, p1.total_score
         FROM phq9_responses p1
         INNER JOIN (
           SELECT user_id, MAX(submitted_at) AS latest_submitted_at
           FROM phq9_responses
           GROUP BY user_id
         ) latest ON latest.user_id = p1.user_id AND latest.latest_submitted_at = p1.submitted_at
       ) phq ON phq.user_id = rc.user_id
       LEFT JOIN (
         SELECT g1.user_id, g1.total_score
         FROM gad7_responses g1
         INNER JOIN (
           SELECT user_id, MAX(submitted_at) AS latest_submitted_at
           FROM gad7_responses
           GROUP BY user_id
         ) latest ON latest.user_id = g1.user_id AND latest.latest_submitted_at = g1.submitted_at
       ) gad ON gad.user_id = rc.user_id
       LEFT JOIN (
         SELECT user_id,
                ROUND(AVG(mood), 2) AS avg_mood_7d,
                ROUND(AVG(energy), 2) AS avg_energy_7d
         FROM esm_checkins
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY user_id
       ) esm ON esm.user_id = rc.user_id
       WHERE u.role = 'student'
       ORDER BY rc.created_at DESC`,
      []
    );

    const rows = latestStudentsResult.rows || [];

    const riskDistribution = { Low: 0, Moderate: 0, High: 0, Crisis: 0 };
    const cohortByCollege = new Map();
    const cohortByYearLevel = new Map();
    const cohortByProgram = new Map();
    const driverMap = new Map();

    rows.forEach((row) => {
      const riskLevel = ['Low', 'Moderate', 'High', 'Crisis'].includes(row.risk_level) ? row.risk_level : 'Low';
      riskDistribution[riskLevel] += 1;

      const college = row.college?.trim() || 'Unknown';
      const yearLevel = row.year_level?.toString() || 'Unknown';
      const program = row.program?.trim() || 'Unknown';

      const bump = (map, key) => {
        const next = map.get(key) || { key, Low: 0, Moderate: 0, High: 0, Crisis: 0, total: 0 };
        next[riskLevel] += 1;
        next.total += 1;
        map.set(key, next);
      };

      bump(cohortByCollege, college);
      bump(cohortByYearLevel, yearLevel);
      bump(cohortByProgram, program);

      const shapDrivers = Array.isArray(row.shap_drivers) ? row.shap_drivers : (() => {
        try { return JSON.parse(row.shap_drivers || '[]'); } catch { return []; }
      })();

      shapDrivers.forEach((driver) => {
        const feature = String(driver.feature || 'Unknown');
        const shapValue = Number(driver.shap_value || 0);
        const current = driverMap.get(feature) || { feature, avg_shap_value: 0, frequency: 0 };
        current.avg_shap_value += shapValue;
        current.frequency += 1;
        driverMap.set(feature, current);
      });
    });

    const makeSummary = (days) => ({
      Low: riskDistribution.Low,
      Moderate: riskDistribution.Moderate,
      High: riskDistribution.High,
      Crisis: riskDistribution.Crisis,
      window: days,
    });

    const topDrivers = [...driverMap.values()]
      .map((driver) => ({
        ...driver,
        avg_shap_value: driver.frequency > 0 ? driver.avg_shap_value / driver.frequency : 0,
      }))
      .sort((a, b) => Math.abs(b.avg_shap_value) - Math.abs(a.avg_shap_value))
      .slice(0, 10);

    const userIds = rows.map((_row, index) => `case-${String(index + 1).padStart(3, '0')}`);
    const features = {
      dass21_depression: rows.map((row) => Number(row.dass21_depression || 0)),
      dass21_anxiety: rows.map((row) => Number(row.dass21_anxiety || 0)),
      dass21_stress: rows.map((row) => Number(row.dass21_stress || 0)),
      phq9_score: rows.map((row) => Number(row.phq9_latest_score || row.phq9_score || 0)),
      gad7_score: rows.map((row) => Number(row.gad7_latest_score || row.gad7_score || 0)),
      esm_mood_avg_7d: rows.map((row) => Number(row.avg_mood_7d || 0)),
      esm_energy_avg_7d: rows.map((row) => Number(row.avg_energy_7d || 0)),
    };

    let mlResponse = null;
    try {
      mlResponse = await axios.post(
        `${ML_SERVICE_URL}/api/predict/batch`,
        { userIds, features },
        { timeout: 30000 }
      );
    } catch (mlError) {
      if (mlError.code !== 'ECONNREFUSED') {
        console.warn('ML batch prediction failed, using local scoring fallback:', mlError.message);
      }
    }

    const localRiskProbability = (row) => {
      const score = (
        Number(row.dass21_depression || 0) * 0.14 +
        Number(row.dass21_anxiety || 0) * 0.12 +
        Number(row.dass21_stress || 0) * 0.16 +
        Number(row.phq9_latest_score || row.phq9_score || 0) * 0.18 +
        Number(row.gad7_latest_score || row.gad7_score || 0) * 0.16 +
        Math.max(0, 10 - Number(row.avg_mood_7d || 0)) * 0.12 +
        Math.max(0, 10 - Number(row.avg_energy_7d || 0)) * 0.12
      );

      const crisisWeight = Math.min(0.25, score / 100);
      const highWeight = Math.min(0.45, score / 40);
      const moderateWeight = Math.min(0.2, score / 60);
      const lowWeight = Math.max(0.05, 1 - (crisisWeight + highWeight + moderateWeight));
      const total = lowWeight + moderateWeight + highWeight + crisisWeight;

      return {
        Low: Number((lowWeight / total).toFixed(4)),
        Moderate: Number((moderateWeight / total).toFixed(4)),
        High: Number((highWeight / total).toFixed(4)),
        Crisis: Number((crisisWeight / total).toFixed(4)),
      };
    };

    const localPredictionFor = (row, index) => {
      const contributionSet = [
        { feature: 'phq9_score', value: Number(row.phq9_latest_score || row.phq9_score || 0), weight: 0.36, direction: 'increases_risk' },
        { feature: 'dass21_stress', value: Number(row.dass21_stress || row.dass21_score || 0), weight: 0.28, direction: 'increases_risk' },
        { feature: 'dass21_anxiety', value: Number(row.dass21_anxiety || 0), weight: 0.18, direction: 'increases_risk' },
        { feature: 'esm_mood_avg_7d', value: Number(row.avg_mood_7d || 0), weight: 0.10, direction: 'decreases_risk' },
        { feature: 'esm_energy_avg_7d', value: Number(row.avg_energy_7d || 0), weight: 0.08, direction: 'decreases_risk' },
      ];

      const riskProbability = localRiskProbability(row);
      const predictedRisk = Object.entries(riskProbability).sort((a, b) => b[1] - a[1])[0][0];
      const shapValues = contributionSet
        .map((entry) => ({
          feature: entry.feature,
          value: entry.value,
          impact: Number((entry.value * entry.weight / 10).toFixed(4)),
          direction: entry.direction,
        }))
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
        .slice(0, 3);

      return {
        caseId: userIds[index],
        predictedRisk,
        riskProbability,
        shapValues,
        topDriver: shapValues[0]?.feature === 'phq9_score' ? 'PHQ-9 Score (Depression)' : shapValues[0]?.feature,
      };
    };

    const predictions = rows.map((row, index) => {
      const mlPrediction = mlResponse?.data?.predictions?.[index];

      if (mlPrediction) {
        return {
          caseId: mlPrediction.caseId || userIds[index],
          predictedRisk: mlPrediction.predictedRisk || mlPrediction.predicted_risk_level || row.risk_level || 'Low',
          riskProbability: mlPrediction.riskProbability || mlPrediction.risk_probability || localRiskProbability(row),
          shapValues: mlPrediction.shapValues || mlPrediction.shap_values || [],
          topDriver: mlPrediction.topDriver || mlPrediction.top_driver || 'Unknown',
        };
      }

      return localPredictionFor(row, index);
    });

    const modelUsed = mlResponse?.data?.modelUsed || 'logistic_regression_fallback';
    const generatedAt = mlResponse?.data?.generatedAt || new Date().toISOString();
    const totalStudents = rows.length;
    const atRiskCount = rows.filter((row) => ['High', 'Crisis'].includes(row.risk_level)).length;

    return res.json({
      success: true,
      data: {
        generatedAt,
        totalStudentsMonitored: totalStudents,
        totalAssessmentsThisMonth: totalStudents,
        riskDistribution: {
          summary_7d: makeSummary(7),
          summary_14d: makeSummary(14),
          summary_30d: makeSummary(30),
        },
        cohortAnalysis: {
          byCollege: [...cohortByCollege.values()],
          byYearLevel: [...cohortByYearLevel.values()],
          byProgram: [...cohortByProgram.values()],
        },
        rollingAverages: {
          mood: {
            avg7d: Number(rows.reduce((sum, row) => sum + Number(row.avg_mood_7d || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
            avg14d: Number(rows.reduce((sum, row) => sum + Number(row.avg_mood_7d || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
            avg30d: Number(rows.reduce((sum, row) => sum + Number(row.avg_mood_7d || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
          },
          energy: {
            avg7d: Number(rows.reduce((sum, row) => sum + Number(row.avg_energy_7d || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
            avg14d: Number(rows.reduce((sum, row) => sum + Number(row.avg_energy_7d || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
            avg30d: Number(rows.reduce((sum, row) => sum + Number(row.avg_energy_7d || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
          },
          stress: {
            avg7d: Number(rows.reduce((sum, row) => sum + Number(row.dass21_stress || row.dass21_score || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
            avg14d: Number(rows.reduce((sum, row) => sum + Number(row.dass21_stress || row.dass21_score || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
            avg30d: Number(rows.reduce((sum, row) => sum + Number(row.dass21_stress || row.dass21_score || 0), 0) / Math.max(totalStudents, 1)).toFixed(2),
          },
        },
        controlChart: {
          baseline: { mood: 0, energy: 0, stress: 0 },
          upperControlLimit: { mood: 0, energy: 0, stress: 0 },
          lowerControlLimit: { mood: 0, energy: 0, stress: 0 },
          outOfControl: [],
        },
        assessmentBreakdown: {
          dass21: { totalTaken: totalStudents, avgDepression: 0, avgAnxiety: 0, avgStress: 0 },
          phq9: { totalTaken: totalStudents, avgScore: 0, severeCount: 0 },
          gad7: { totalTaken: totalStudents, avgScore: 0, severeCount: 0 },
        },
        predictiveAnalytics: {
          predictions,
          modelUsed,
          generatedAt,
          modelAccuracy: null,
          topShapDrivers: topDrivers.slice(0, 5),
          atRiskCount,
        },
        prescriptiveRecommendations: [
          { riskLevel: 'Crisis', interventionRequired: 'Immediate', action: 'Reveal student identity and contact immediately', protocol: 'Call NCMH: 1553 if unreachable', timeframe: 'Within 1 hour', count: rows.filter((row) => row.risk_level === 'Crisis').length },
          { riskLevel: 'High', interventionRequired: 'Urgent', action: 'Schedule OGC appointment within 24 hours', protocol: 'Send wellness resources from GINHAWA', timeframe: 'Within 24 hours', count: rows.filter((row) => row.risk_level === 'High').length },
          { riskLevel: 'Moderate', interventionRequired: 'Monitor', action: 'Monitor for 7 days, send check-in reminder', protocol: 'Recommend GINHAWA wellness content', timeframe: 'Within 7 days', count: rows.filter((row) => row.risk_level === 'Moderate').length },
          { riskLevel: 'Low', interventionRequired: 'None', action: 'Continue regular monitoring', protocol: 'No action required', timeframe: 'Next assessment cycle', count: rows.filter((row) => row.risk_level === 'Low').length },
        ],
      },
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
