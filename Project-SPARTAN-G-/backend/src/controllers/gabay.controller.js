import { query } from '../config/db.js';
import { emitOgcEvent, subscribeOgcEvent } from '../services/ogcRealtime.service.js';
import crypto from 'crypto';

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Crisis'];

function normalizeRiskLevel(level) {
  return RISK_LEVELS.includes(level) ? level : 'Unknown';
}

function buildEmptyRiskCounts() {
  return { Low: 0, Moderate: 0, High: 0, Crisis: 0 };
}

function buildCaseId(notificationId, createdAt) {
  const year = new Date(createdAt || Date.now()).getFullYear();
  const numericId = Number(notificationId);
  const sequence = Number.isFinite(numericId) ? String(numericId).padStart(3, '0') : '000';
  return `CASE-${year}-${sequence}`;
}

function formatTimeAgo(value) {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function safeJsonParse(value, fallback = []) {
  if (value == null || value === '') {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function resolveAssessmentType(title = '', body = '', riskRow = {}) {
  const text = `${title} ${body}`.toUpperCase();

  if (text.includes('PHQ-9')) {
    return 'PHQ-9 (Depression)';
  }

  if (text.includes('GAD-7')) {
    return 'GAD-7 (Anxiety)';
  }

  if (text.includes('DASS-21')) {
    return 'DASS-21 (Stress)';
  }

  const candidates = [
    { assessmentType: 'PHQ-9 (Depression)', score: Number(riskRow.phq9_score || 0) },
    { assessmentType: 'GAD-7 (Anxiety)', score: Number(riskRow.gad7_score || 0) },
    { assessmentType: 'DASS-21 (Stress)', score: Number(riskRow.dass21_score || 0) },
  ].sort((a, b) => b.score - a.score);

  return candidates[0].score > 0 ? candidates[0].assessmentType : 'Assessment Summary';
}

function resolveAssessmentScore(assessmentType, riskRow = {}) {
  if (assessmentType.startsWith('PHQ-9')) {
    return Number(riskRow.phq9_score || 0);
  }

  if (assessmentType.startsWith('GAD-7')) {
    return Number(riskRow.gad7_score || 0);
  }

  if (assessmentType.startsWith('DASS-21')) {
    return Number(riskRow.dass21_score || 0);
  }

  return Math.max(Number(riskRow.phq9_score || 0), Number(riskRow.gad7_score || 0), Number(riskRow.dass21_score || 0));
}

function toRiskDistribution(rows) {
  const out = buildEmptyRiskCounts();

  for (const row of rows) {
    const level = normalizeRiskLevel(String(row.risk_level || '').trim());
    if (level !== 'Unknown') {
      out[level] = Number(row.count || 0);
    }
  }

  return out;
}

function latestRiskRowsSql() {
  return `
    SELECT rc.*
    FROM risk_classifications rc
    INNER JOIN (
      SELECT user_id, MAX(created_at) AS latest_created_at
      FROM risk_classifications
      GROUP BY user_id
    ) latest ON latest.user_id = rc.user_id AND latest.latest_created_at = rc.created_at
  `;
}

export async function getPopulationDashboard(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    async function getWindowSummary(days) {
      const result = await query(
        `SELECT rc.risk_level, COUNT(*) AS count
         FROM (${latestRiskRowsSql()}) rc
         WHERE rc.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
         GROUP BY rc.risk_level`,
        []
      );

      return toRiskDistribution(result.rows);
    }

    async function getCohortSummary(groupField, selectExpression) {
      const result = await query(
        `SELECT ${selectExpression} AS cohort,
                SUM(CASE WHEN rc.risk_level = 'Low' THEN 1 ELSE 0 END) AS Low,
                SUM(CASE WHEN rc.risk_level = 'Moderate' THEN 1 ELSE 0 END) AS Moderate,
                SUM(CASE WHEN rc.risk_level = 'High' THEN 1 ELSE 0 END) AS High,
                SUM(CASE WHEN rc.risk_level = 'Crisis' THEN 1 ELSE 0 END) AS Crisis,
                COUNT(*) AS total
         FROM (${latestRiskRowsSql()}) rc
         INNER JOIN users u ON u.id = rc.user_id
         WHERE u.role = 'student'
         GROUP BY cohort
         ORDER BY cohort ASC`,
        []
      );

      return result.rows.map((row) => ({
        [groupField]: row.cohort,
        Low: Number(row.Low || 0),
        Moderate: Number(row.Moderate || 0),
        High: Number(row.High || 0),
        Crisis: Number(row.Crisis || 0),
        total: Number(row.total || 0),
      }));
    }

    const summary7d = await getWindowSummary(7);
    const summary14d = await getWindowSummary(14);
    const summary30d = await getWindowSummary(30);

    const byCollege = await getCohortSummary('college', "COALESCE(NULLIF(TRIM(u.college), ''), 'Unknown')");
    const byYearLevel = await getCohortSummary('yearLevel', "COALESCE(CAST(u.year_level AS CHAR), 'Unknown')");
    const byProgram = await getCohortSummary('program', "COALESCE(NULLIF(TRIM(u.program), ''), 'Unknown')");

    const totalStudentsMonitoredRes = await query(
      `SELECT COUNT(DISTINCT rc.user_id) AS count
       FROM (${latestRiskRowsSql()}) rc
       INNER JOIN users u ON u.id = rc.user_id
       WHERE u.role = 'student'`,
      []
    );

    const totalAssessmentsThisMonthRes = await query(
      `SELECT COUNT(*) AS count
       FROM risk_classifications rc
       INNER JOIN users u ON u.id = rc.user_id
       WHERE u.role = 'student'
         AND rc.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
      []
    );

    const mood7Res = await query(`SELECT ROUND(AVG(mood), 2) AS avgMood FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, []);
    const mood14Res = await query(`SELECT ROUND(AVG(mood), 2) AS avgMood FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)`, []);
    const mood30Res = await query(`SELECT ROUND(AVG(mood), 2) AS avgMood FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`, []);
    const energy7Res = await query(`SELECT ROUND(AVG(energy), 2) AS avgEnergy FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, []);
    const energy14Res = await query(`SELECT ROUND(AVG(energy), 2) AS avgEnergy FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)`, []);
    const energy30Res = await query(`SELECT ROUND(AVG(energy), 2) AS avgEnergy FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`, []);
    const stress7Res = await query(`SELECT ROUND(AVG(stress), 2) AS avgStress FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, []);
    const stress14Res = await query(`SELECT ROUND(AVG(stress), 2) AS avgStress FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)`, []);
    const stress30Res = await query(`SELECT ROUND(AVG(stress), 2) AS avgStress FROM esm_checkins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`, []);

    const assessmentBreakdownRes = await query(
      `SELECT
        (SELECT COUNT(*) FROM dass21_assessments) AS dass21_total,
        ROUND((SELECT AVG(depression_score) FROM dass21_assessments), 2) AS dass21_avg_depression,
        ROUND((SELECT AVG(anxiety_score) FROM dass21_assessments), 2) AS dass21_avg_anxiety,
        ROUND((SELECT AVG(stress_score) FROM dass21_assessments), 2) AS dass21_avg_stress,
        (SELECT COUNT(*) FROM phq9_responses) AS phq9_total,
        ROUND((SELECT AVG(total_score) FROM phq9_responses), 2) AS phq9_avg_score,
        COALESCE((SELECT SUM(CASE WHEN total_score >= 20 THEN 1 ELSE 0 END) FROM phq9_responses), 0) AS phq9_severe_count,
        (SELECT COUNT(*) FROM gad7_responses) AS gad7_total,
        ROUND((SELECT AVG(total_score) FROM gad7_responses), 2) AS gad7_avg_score,
        COALESCE((SELECT SUM(CASE WHEN total_score >= 15 THEN 1 ELSE 0 END) FROM gad7_responses), 0) AS gad7_severe_count`,
      []
    );

    const shapRowsRes = await query(
      `SELECT rc.shap_drivers
       FROM (${latestRiskRowsSql()}) rc
       WHERE rc.shap_drivers IS NOT NULL`,
      []
    );

    const esmStatsRes = await query(
      `SELECT
        ROUND(AVG(mood), 2) AS avgMood,
        ROUND(STDDEV_POP(mood), 2) AS sdMood,
        ROUND(AVG(energy), 2) AS avgEnergy,
        ROUND(STDDEV_POP(energy), 2) AS sdEnergy,
        ROUND(AVG(stress), 2) AS avgStress,
        ROUND(STDDEV_POP(stress), 2) AS sdStress
       FROM esm_checkins
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      []
    );

    const esmRecentRowsRes = await query(
      `SELECT created_at, mood, energy, stress
       FROM esm_checkins
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY created_at DESC
       LIMIT 250`,
      []
    );

    const prescriptiveCountsRes = await query(
      `SELECT rc.risk_level, COUNT(*) AS count
       FROM (${latestRiskRowsSql()}) rc
       INNER JOIN users u ON u.id = rc.user_id
       WHERE u.role = 'student'
       GROUP BY rc.risk_level`,
      []
    );

    const impactRank = { LOW: 1, MODERATE: 2, HIGH: 3 };
    const impactByFeature = new Map();

    for (const row of shapRowsRes.rows || []) {
      let drivers = [];
      try {
        drivers = Array.isArray(row.shap_drivers) ? row.shap_drivers : JSON.parse(row.shap_drivers || '[]');
      } catch {
        drivers = [];
      }

      for (const driver of drivers) {
        const feature = String(driver.feature || 'Unknown').trim();
        const impact = String(driver.impact || 'LOW').toUpperCase();
        const current = impactByFeature.get(feature) || { feature, impactScoreSum: 0, count: 0 };
        current.impactScoreSum += impactRank[impact] || 1;
        current.count += 1;
        impactByFeature.set(feature, current);
      }
    }

    const topShapDrivers = [...impactByFeature.values()]
      .map((item) => {
        const avgScore = item.count > 0 ? item.impactScoreSum / item.count : 0;
        const avgImpact = avgScore >= 2.5 ? 'HIGH' : avgScore >= 1.5 ? 'MODERATE' : 'LOW';
        return {
          feature: item.feature,
          avgImpact,
          count: item.count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const moodAvg = Number(esmStatsRes.rows?.[0]?.avgMood || 0);
    const moodSd = Number(esmStatsRes.rows?.[0]?.sdMood || 0);
    const energyAvg = Number(esmStatsRes.rows?.[0]?.avgEnergy || 0);
    const energySd = Number(esmStatsRes.rows?.[0]?.sdEnergy || 0);
    const stressAvg = Number(esmStatsRes.rows?.[0]?.avgStress || 0);
    const stressSd = Number(esmStatsRes.rows?.[0]?.sdStress || 0);

    const controlChart = {
      baseline: {
        mood: moodAvg,
        energy: energyAvg,
        stress: stressAvg,
      },
      upperControlLimit: {
        mood: Math.min(10, moodAvg + 2 * moodSd),
        energy: Math.min(10, energyAvg + 2 * energySd),
        stress: stressAvg + 2 * stressSd,
      },
      lowerControlLimit: {
        mood: Math.max(0, moodAvg - 2 * moodSd),
        energy: Math.max(0, energyAvg - 2 * energySd),
        stress: Math.max(0, stressAvg - 2 * stressSd),
      },
      outOfControl: [],
    };

    for (const row of esmRecentRowsRes.rows || []) {
      const checks = [
        { metric: 'mood', value: Number(row.mood), lower: controlChart.lowerControlLimit.mood, upper: controlChart.upperControlLimit.mood },
        { metric: 'energy', value: Number(row.energy), lower: controlChart.lowerControlLimit.energy, upper: controlChart.upperControlLimit.energy },
        { metric: 'stress', value: Number(row.stress), lower: controlChart.lowerControlLimit.stress, upper: controlChart.upperControlLimit.stress },
      ];

      for (const check of checks) {
        if (check.value < check.lower || check.value > check.upper) {
          controlChart.outOfControl.push({
            date: new Date(row.created_at).toISOString().slice(0, 10),
            metric: check.metric,
            value: check.value,
          });
        }
      }
    }

    const assessmentBreakdown = assessmentBreakdownRes.rows?.[0] || {};
    const prescriptiveRecommendations = [
      { riskLevel: 'Crisis', interventionRequired: 'Immediate', action: 'Reveal student identity and contact immediately', protocol: 'Call NCMH: 1553 if unreachable', timeframe: 'Within 1 hour', count: 0 },
      { riskLevel: 'High', interventionRequired: 'Urgent', action: 'Schedule OGC appointment within 24 hours', protocol: 'Send wellness resources from GINHAWA', timeframe: 'Within 24 hours', count: 0 },
      { riskLevel: 'Moderate', interventionRequired: 'Monitor', action: 'Monitor for 7 days, send check-in reminder', protocol: 'Recommend GINHAWA wellness content', timeframe: 'Within 7 days', count: 0 },
      { riskLevel: 'Low', interventionRequired: 'None', action: 'Continue regular monitoring', protocol: 'No action required', timeframe: 'Next assessment cycle', count: 0 },
    ];

    for (const row of prescriptiveCountsRes.rows || []) {
      const recommendation = prescriptiveRecommendations.find((item) => item.riskLevel === row.risk_level);
      if (recommendation) {
        recommendation.count = Number(row.count || 0);
      }
    }

    const rollingAverages = {
      mood: {
        avg7d: Number(mood7Res.rows?.[0]?.avgMood || 0),
        avg14d: Number(mood14Res.rows?.[0]?.avgMood || 0),
        avg30d: Number(mood30Res.rows?.[0]?.avgMood || 0),
      },
      energy: {
        avg7d: Number(energy7Res.rows?.[0]?.avgEnergy || 0),
        avg14d: Number(energy14Res.rows?.[0]?.avgEnergy || 0),
        avg30d: Number(energy30Res.rows?.[0]?.avgEnergy || 0),
      },
      stress: {
        avg7d: Number(stress7Res.rows?.[0]?.avgStress || 0),
        avg14d: Number(stress14Res.rows?.[0]?.avgStress || 0),
        avg30d: Number(stress30Res.rows?.[0]?.avgStress || 0),
      },
    };

    return res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        totalStudentsMonitored: Number(totalStudentsMonitoredRes.rows?.[0]?.count || 0),
        totalAssessmentsThisMonth: Number(totalAssessmentsThisMonthRes.rows?.[0]?.count || 0),
        riskDistribution: {
          summary_7d: summary7d,
          summary_14d: summary14d,
          summary_30d: summary30d,
        },
        cohortAnalysis: {
          byCollege,
          byYearLevel,
          byProgram,
        },
        rollingAverages,
        controlChart,
        assessmentBreakdown: {
          dass21: {
            totalTaken: Number(assessmentBreakdown.dass21_total || 0),
            avgDepression: Number(assessmentBreakdown.dass21_avg_depression || 0),
            avgAnxiety: Number(assessmentBreakdown.dass21_avg_anxiety || 0),
            avgStress: Number(assessmentBreakdown.dass21_avg_stress || 0),
          },
          phq9: {
            totalTaken: Number(assessmentBreakdown.phq9_total || 0),
            avgScore: Number(assessmentBreakdown.phq9_avg_score || 0),
            severeCount: Number(assessmentBreakdown.phq9_severe_count || 0),
          },
          gad7: {
            totalTaken: Number(assessmentBreakdown.gad7_total || 0),
            avgScore: Number(assessmentBreakdown.gad7_avg_score || 0),
            severeCount: Number(assessmentBreakdown.gad7_severe_count || 0),
          },
        },
        topShapDrivers,
        prescriptiveRecommendations,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getNotifications(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const result = await query(
      `SELECT 
        n.id, n.facilitator_user_id, n.risk_level, n.title, n.body, 
        n.seen, n.created_at, n.updated_at,
        rc.risk_level AS latest_risk_level,
        rc.dass21_score, rc.phq9_score, rc.gad7_score
       FROM ogc_notifications n
       LEFT JOIN (
         SELECT rc1.*
         FROM risk_classifications rc1
         INNER JOIN (
           SELECT user_id, MAX(created_at) AS latest_created_at
           FROM risk_classifications
           GROUP BY user_id
         ) latest ON latest.user_id = rc1.user_id AND latest.latest_created_at = rc1.created_at
       ) rc ON rc.user_id = n.student_id
       ORDER BY n.created_at DESC`,
      []
    );

    const notifications = result.rows.map((row) => ({
      notif_id: crypto.randomUUID(),
      caseId: buildCaseId(row.id, row.created_at),
      riskLevel: normalizeRiskLevel(row.risk_level || row.latest_risk_level),
      assessmentType: resolveAssessmentType(row.title, row.body, row),
      score: resolveAssessmentScore(resolveAssessmentType(row.title, row.body, row), row),
      timeAgo: formatTimeAgo(row.created_at),
      isAnonymized: true,
      seen: Boolean(row.seen),
      acknowledged: Boolean(row.seen),
      acknowledgedAt: row.seen ? row.updated_at : null,
    }));

    return res.json({ success: true, data: notifications.filter((item) => !item.acknowledged) });
  } catch (error) {
    return next(error);
  }
}

export async function getNotificationHistory(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const result = await query(
      `SELECT 
        n.id, n.facilitator_user_id, n.risk_level, n.title, n.body, 
        n.seen, n.created_at, n.updated_at,
        rc.risk_level AS latest_risk_level,
        rc.dass21_score, rc.phq9_score, rc.gad7_score
       FROM ogc_notifications n
       LEFT JOIN (
         SELECT rc1.*
         FROM risk_classifications rc1
         INNER JOIN (
           SELECT user_id, MAX(created_at) AS latest_created_at
           FROM risk_classifications
           GROUP BY user_id
         ) latest ON latest.user_id = rc1.user_id AND latest.latest_created_at = rc1.created_at
       ) rc ON rc.user_id = n.student_id
       WHERE n.seen = 1
       ORDER BY n.updated_at DESC, n.created_at DESC`);

    const history = result.rows.map((row) => ({
      notif_id: crypto.randomUUID(),
      caseId: buildCaseId(row.id, row.created_at),
      riskLevel: normalizeRiskLevel(row.risk_level || row.latest_risk_level),
      assessmentType: resolveAssessmentType(row.title, row.body, row),
      score: resolveAssessmentScore(resolveAssessmentType(row.title, row.body, row), row),
      timeAgo: formatTimeAgo(row.created_at),
      isAnonymized: true,
      seen: true,
      acknowledged: true,
      acknowledgedAt: row.updated_at,
    }));

    return res.json({ success: true, data: history });
  } catch (error) {
    return next(error);
  }
}

export async function acknowledgeNotification(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    let notificationId = null;
    if (/^\d+$/.test(String(id))) {
      notificationId = Number(id);
    } else {
      const notificationLookup = await query(
        `SELECT id FROM ogc_notifications
         WHERE CONCAT('CASE-', YEAR(created_at), '-', LPAD(id, 3, '0')) = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [id]
      );

      if (notificationLookup.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      notificationId = notificationLookup.rows[0].id;
    }

    const result = await query(
      `UPDATE ogc_notifications SET seen = 1, updated_at = NOW() WHERE id = $1`,
      [notificationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = await query(
      `SELECT id, risk_level, title, body, seen, created_at, updated_at
       FROM ogc_notifications WHERE id = $1`,
      [notificationId]
    );

    return res.json({
      success: true,
      data: {
        notif_id: crypto.randomUUID(),
        caseId: buildCaseId(updated.rows[0].id, updated.rows[0].created_at),
        riskLevel: normalizeRiskLevel(updated.rows[0].risk_level),
        assessmentType: resolveAssessmentType(updated.rows[0].title, updated.rows[0].body),
        score: 0,
        timeAgo: formatTimeAgo(updated.rows[0].created_at),
        isAnonymized: true,
        seen: Boolean(updated.rows[0].seen),
        acknowledged: Boolean(updated.rows[0].seen),
        acknowledgedAt: updated.rows[0].updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    let notificationId = null;
    if (/^\d+$/.test(String(id))) {
      notificationId = Number(id);
    } else {
      const notificationLookup = await query(
        `SELECT id FROM ogc_notifications
         WHERE CONCAT('CASE-', YEAR(created_at), '-', LPAD(id, 3, '0')) = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [id]
      );

      if (notificationLookup.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      notificationId = notificationLookup.rows[0].id;
    }

    const selected = await query(
      `SELECT id, risk_level, title, body, seen, created_at, updated_at
       FROM ogc_notifications WHERE id = $1`,
      [notificationId]
    );

    if (selected.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const result = await query(
      `DELETE FROM ogc_notifications WHERE id = $1`,
      [notificationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    emitOgcEvent('dashboard-updated', {
      source: 'notification-deleted',
      notificationId,
      caseId: buildCaseId(selected.rows[0].id, selected.rows[0].created_at),
      riskLevel: selected.rows[0].risk_level,
    });

    return res.json({
      success: true,
      data: {
        notif_id: crypto.randomUUID(),
        caseId: buildCaseId(selected.rows[0].id, selected.rows[0].created_at),
        deleted: true,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentDetail(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    let studentUserId = null;
    let selectedNotification = null;

    if (/^\d+$/.test(String(id))) {
      studentUserId = Number(id);
    } else {
      const notificationResult = await query(
        `SELECT id, student_id, risk_level, created_at
         FROM ogc_notifications
         WHERE CONCAT('CASE-', YEAR(created_at), '-', LPAD(id, 3, '0')) = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [id]
      );

      if (notificationResult.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Case not found' });
      }

      selectedNotification = notificationResult.rows[0];
      studentUserId = Number(selectedNotification.student_id);
    }

    const riskRes = await query(
      `SELECT risk_level, dass21_score, phq9_score, gad7_score, trajectory, shap_drivers
       FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [studentUserId]
    );

    const riskData = riskRes.rowCount > 0 ? riskRes.rows[0] : null;
    const riskLevel = normalizeRiskLevel(riskData ? riskData.risk_level : selectedNotification?.risk_level);

    if (riskLevel !== 'Crisis') {
      throw new ForbiddenError('Identity only revealed for Crisis cases');
    }

    const userRes = await query(
      `SELECT id, student_id, first_name, last_name, college, year_level, program, sex FROM users WHERE id = $1`,
      [studentUserId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = userRes.rows[0];

    // Get appointments
    const apptRes = await query(
      `SELECT appointment_id, scheduled_at, status, notes FROM appointments
       WHERE user_id = $1 ORDER BY scheduled_at DESC`,
      [studentUserId]
    );

    const data = {
      id: student.id,
      studentId: student.student_id,
      firstName: student.first_name,
      lastName: student.last_name,
      college: student.college,
      yearLevel: student.year_level,
      program: student.program,
      sex: student.sex,
      currentRiskLevel: riskData ? riskData.risk_level : 'Unknown',
      caseId: selectedNotification ? buildCaseId(selectedNotification.id, selectedNotification.created_at) : null,
      scores: riskData
        ? {
            dass21: riskData.dass21_score,
            phq9: riskData.phq9_score,
            gad7: riskData.gad7_score,
          }
        : {},
      trajectory: riskData ? riskData.trajectory : 'Insufficient Data',
      shapDrivers: riskData ? JSON.parse(riskData.shap_drivers || '[]') : [],
      appointments: apptRes.rows.map((a) => ({
        appointmentId: a.appointment_id,
        scheduledAt: a.scheduled_at,
        status: a.status,
        notes: a.notes,
      })),
    };

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
}

export async function getCaseMapping(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { caseId } = req.params;

    if (!caseId) {
      return res.status(400).json({ success: false, message: 'caseId required' });
    }

    // Lookup notification by constructed caseId
    const notificationResult = await query(
      `SELECT id, student_id FROM ogc_notifications
       WHERE CONCAT('CASE-', YEAR(created_at), '-', LPAD(id, 3, '0')) = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [caseId]
    );

    if (notificationResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const notif = notificationResult.rows[0];

    // Get latest risk for that student
    const riskRes = await query(
      `SELECT risk_level FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [notif.student_id]
    );

    const riskLevel = riskRes.rowCount > 0 ? String(riskRes.rows[0].risk_level) : null;

    // Only allow SR-code reveal for Crisis cases
    if (riskLevel !== 'Crisis') {
      return res.status(403).json({ success: false, message: 'SR-code reveal only allowed for Crisis cases' });
    }

    const userRes = await query(
      `SELECT student_id FROM users WHERE id = $1 LIMIT 1`,
      [notif.student_id]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const srCode = userRes.rows[0].student_id;

    return res.json({ success: true, data: { caseId, srCode } });
  } catch (error) {
    return next(error);
  }
}

export async function createAppointment(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { studentId, scheduledAt, notes } = req.body;

    if (!studentId || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'studentId and scheduledAt are required' });
    }

    // Accept either numeric user id or student_id string
    const studentRes = await query(
      `SELECT id, student_id FROM users WHERE id = $1 OR student_id = $2 LIMIT 1`,
      [studentId, studentId]
    );

    if (studentRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const resolvedUserId = studentRes.rows[0].id;
    const resolvedStudentId = studentRes.rows[0].student_id;

    // Get current risk level
    const riskRes = await query(
      `SELECT risk_level FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [resolvedUserId]
    );

    const riskLevel = riskRes.rowCount > 0 ? riskRes.rows[0].risk_level : null;
    const appointmentId = crypto.randomUUID();

    await query(
      `INSERT INTO appointments
       (appointment_id, user_id, student_id, facilitator_id, scheduled_at, status, notes, risk_level_at_booking, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, NOW())`,
      [appointmentId, resolvedUserId, resolvedStudentId, req.user.id, scheduledAt, notes || null, riskLevel]
    );

    return res.status(201).json({
      success: true,
      data: {
        appointmentId,
        studentId: resolvedStudentId,
        scheduledAt,
        status: 'pending',
        notes,
        riskLevelAtBooking: riskLevel,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAppointments(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const result = await query(
      `SELECT appointment_id, user_id, facilitator_id, scheduled_at, status, notes, risk_level_at_booking, created_at
       FROM appointments
       ORDER BY scheduled_at DESC`,
      []
    );

    const appointments = result.rows.map((row) => ({
      appointmentId: row.appointment_id,
      studentId: row.user_id,
      facilitatorId: row.facilitator_id,
      scheduledAt: row.scheduled_at,
      status: row.status,
      notes: row.notes,
      riskLevelAtBooking: row.risk_level_at_booking,
      createdAt: row.created_at,
    }));

    return res.json({ success: true, data: appointments });
  } catch (error) {
    return next(error);
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    // Check if user is facilitator
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await query(
      `UPDATE appointments SET status = $1 WHERE appointment_id = $2`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const updated = await query(
      `SELECT appointment_id, user_id, facilitator_id, scheduled_at, status, notes, risk_level_at_booking, created_at
       FROM appointments WHERE appointment_id = $1`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        appointmentId: updated.rows[0].appointment_id,
        studentId: updated.rows[0].user_id,
        facilitatorId: updated.rows[0].facilitator_id,
        scheduledAt: updated.rows[0].scheduled_at,
        status: updated.rows[0].status,
        notes: updated.rows[0].notes,
        riskLevelAtBooking: updated.rows[0].risk_level_at_booking,
        createdAt: updated.rows[0].created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function approveAppointment(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    const result = await query(
      `UPDATE appointments SET status = 'approved' WHERE appointment_id = ? AND status = 'pending'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found or not in pending status' });
    }

    const updated = await query(
      `SELECT * FROM appointments WHERE appointment_id = ?`,
      [id]
    );

    return res.json({
      success: true,
      data: updated.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

export async function rejectAppointment(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    const result = await query(
      `UPDATE appointments SET status = 'rejected' WHERE appointment_id = ? AND status = 'pending'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found or not in pending status' });
    }

    const updated = await query(
      `SELECT * FROM appointments WHERE appointment_id = ?`,
      [id]
    );

    return res.json({
      success: true,
      data: updated.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

export async function completeAppointment(req, res, next) {
  try {
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    const result = await query(
      `UPDATE appointments SET status = 'completed' WHERE appointment_id = ? AND status = 'approved'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found or not in approved status' });
    }

    const updated = await query(
      `SELECT * FROM appointments WHERE appointment_id = ?`,
      [id]
    );

    return res.json({
      success: true,
      data: updated.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}
