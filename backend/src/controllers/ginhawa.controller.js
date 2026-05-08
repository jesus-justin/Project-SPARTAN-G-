import { query } from '../config/db.js';
import crypto from 'crypto';

export async function getContentForStudent(req, res, next) {
  try {
    // Get student's current risk level
    const riskRes = await query(
      `SELECT risk_level FROM risk_classifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    const studentRiskLevel = riskRes.rowCount > 0 ? riskRes.rows[0].risk_level : 'Low';

    // Get published content matching student's risk level
    const result = await query(
      `SELECT content_id, title, description, content_type, content_url, risk_levels, category, created_at
       FROM ginhawa_content
       WHERE status = 'published'
       ORDER BY category, created_at DESC`,
      []
    );

    // Filter content by risk level
    const filteredContent = result.rows.filter((item) => {
      const riskLevels = item.risk_levels ? JSON.parse(item.risk_levels) : [];
      return riskLevels.length === 0 || riskLevels.includes(studentRiskLevel) || riskLevels.includes('All');
    });

    // Group by category
    const grouped = {};
    filteredContent.forEach((item) => {
      const cat = item.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        contentId: item.content_id,
        title: item.title,
        description: item.description,
        contentType: item.content_type,
        contentUrl: item.content_url,
        category: item.category,
        createdAt: item.created_at,
      });
    });

    return res.json({ success: true, data: { grouped, studentRiskLevel } });
  } catch (error) {
    return next(error);
  }
}

export async function getContentDetail(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT content_id, title, description, content_type, content_url, risk_levels, category, status, created_at
       FROM ginhawa_content
       WHERE content_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    const content = result.rows[0];

    // If status is not published and user is not facilitator, deny access
    if (content.status !== 'published' && req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({
      success: true,
      data: {
        contentId: content.content_id,
        title: content.title,
        description: content.description,
        contentType: content.content_type,
        contentUrl: content.content_url,
        riskLevels: content.risk_levels ? JSON.parse(content.risk_levels) : [],
        category: content.category,
        status: content.status,
        createdAt: content.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function createContent(req, res, next) {
  try {
    // Facilitator only
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { title, description, contentType, contentUrl, riskLevels, category } = req.body;

    if (!title || !contentType) {
      return res.status(400).json({ success: false, message: 'title and contentType are required' });
    }

    const contentId = crypto.randomUUID();

    await query(
      `INSERT INTO ginhawa_content
       (content_id, title, description, content_type, content_url, risk_levels, category, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, NOW())`,
      [
        contentId,
        title,
        description || null,
        contentType,
        contentUrl || null,
        JSON.stringify(riskLevels || []),
        category || null,
        req.user.id,
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        contentId,
        title,
        description,
        contentType,
        contentUrl,
        riskLevels,
        category,
        status: 'draft',
        createdBy: req.user.id,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function editContent(req, res, next) {
  try {
    // Facilitator only
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;
    const { title, description, contentType, contentUrl, riskLevels, category } = req.body;

    const result = await query(
      `UPDATE ginhawa_content
       SET title = $1, description = $2, content_type = $3, content_url = $4, risk_levels = $5, category = $6
       WHERE content_id = $7`,
      [title, description, contentType, contentUrl, JSON.stringify(riskLevels || []), category, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    return res.json({ success: true, message: 'Content updated' });
  } catch (error) {
    return next(error);
  }
}

export async function publishContent(req, res, next) {
  try {
    // Facilitator only
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    const result = await query(
      `UPDATE ginhawa_content SET status = 'published', published_at = NOW() WHERE content_id = $1`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    return res.json({ success: true, message: 'Content published' });
  } catch (error) {
    return next(error);
  }
}

export async function archiveContent(req, res, next) {
  try {
    // Facilitator only
    if (req.user.role !== 'facilitator') {
      return res.status(403).json({ success: false, message: 'Facilitator access required' });
    }

    const { id } = req.params;

    const result = await query(
      `UPDATE ginhawa_content SET status = 'archived' WHERE content_id = $1`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    return res.json({ success: true, message: 'Content archived' });
  } catch (error) {
    return next(error);
  }
}

export async function getSafetyPlan(req, res, next) {
  try {
    const result = await query(
      `SELECT plan_id, warning_signs, coping_strategies, social_supports, professional_contacts,
        safe_environment, reasons_to_live, emergency_contacts, created_at, updated_at
       FROM safety_plans
       WHERE user_id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.json({
        success: true,
        data: {
          planId: null,
          warningSigns: '',
          copingStrategies: '',
          socialSupports: '',
          professionalContacts: '',
          safeEnvironment: '',
          reasonsToLive: '',
          emergencyContacts: '',
        },
      });
    }

    const plan = result.rows[0];

    return res.json({
      success: true,
      data: {
        planId: plan.plan_id,
        warningSigns: plan.warning_signs,
        copingStrategies: plan.coping_strategies,
        socialSupports: plan.social_supports,
        professionalContacts: plan.professional_contacts,
        safeEnvironment: plan.safe_environment,
        reasonsToLive: plan.reasons_to_live,
        emergencyContacts: plan.emergency_contacts,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function upsertSafetyPlan(req, res, next) {
  try {
    const {
      warningSigns,
      copingStrategies,
      socialSupports,
      professionalContacts,
      safeEnvironment,
      reasonsToLive,
      emergencyContacts,
    } = req.body;

    // Check if plan exists
    const existing = await query(
      `SELECT plan_id FROM safety_plans WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );

    let planId;

    if (existing.rowCount > 0) {
      // Update existing plan
      planId = existing.rows[0].plan_id;
      await query(
        `UPDATE safety_plans
         SET warning_signs = $1, coping_strategies = $2, social_supports = $3, professional_contacts = $4,
             safe_environment = $5, reasons_to_live = $6, emergency_contacts = $7, updated_at = NOW()
         WHERE plan_id = $8`,
        [warningSigns, copingStrategies, socialSupports, professionalContacts, safeEnvironment, reasonsToLive, emergencyContacts, planId]
      );
    } else {
      // Create new plan
      planId = crypto.randomUUID();
      await query(
        `INSERT INTO safety_plans
         (plan_id, user_id, student_id, warning_signs, coping_strategies, social_supports, professional_contacts,
          safe_environment, reasons_to_live, emergency_contacts, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          planId,
          req.user.id,
          req.user.studentId,
          warningSigns,
          copingStrategies,
          socialSupports,
          professionalContacts,
          safeEnvironment,
          reasonsToLive,
          emergencyContacts,
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Safety plan saved',
      data: {
        planId,
        warningSigns,
        copingStrategies,
        socialSupports,
        professionalContacts,
        safeEnvironment,
        reasonsToLive,
        emergencyContacts,
      },
    });
  } catch (error) {
    return next(error);
  }
}
