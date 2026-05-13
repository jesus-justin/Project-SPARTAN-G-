import { query } from '../config/db.js';
import crypto from 'crypto';

async function seedGinhawa() {
  try {
    const facilitatorRes = await query(
      `SELECT id FROM users WHERE role = 'facilitator' ORDER BY id ASC LIMIT 1`,
      []
    );

    const facilitatorId = facilitatorRes.rowCount > 0 ? facilitatorRes.rows[0].id : 1;

    const content = [
      {
        title: 'Understanding Stress and Anxiety',
        description: 'Learn about the effects of stress and anxiety on your body and mind.',
        contentType: 'article',
        contentUrl: 'https://example.com/stress-anxiety',
        riskLevels: ['Low', 'Moderate', 'High'],
        category: 'Mental Health Education',
      },
      {
        title: 'Breathing Exercises for Calm',
        description: 'Simple breathing techniques you can use anytime to reduce stress.',
        contentType: 'video',
        contentUrl: 'https://example.com/breathing-exercises',
        riskLevels: ['Low', 'Moderate', 'High', 'Crisis'],
        category: 'Relaxation Techniques',
      },
      {
        title: 'Academic Pressure Coping Strategies',
        description: 'Evidence-based strategies for managing academic pressure and stress.',
        contentType: 'article',
        contentUrl: 'https://example.com/academic-coping',
        riskLevels: ['Low', 'Moderate'],
        category: 'Student Wellness',
      },
      {
        title: 'When to Seek Professional Help',
        description: 'Understand when it is time to reach out to a mental health professional.',
        contentType: 'brochure',
        contentUrl: 'https://example.com/seek-help',
        riskLevels: ['Moderate', 'High'],
        category: 'Mental Health Resources',
      },
      {
        title: 'Crisis Resources Philippines',
        description: 'Emergency resources and hotlines available in the Philippines.',
        contentType: 'article',
        contentUrl: 'https://example.com/crisis-resources',
        riskLevels: ['High', 'Crisis'],
        category: 'Crisis Support',
      },
      {
        title: 'Mindfulness for Students',
        description: 'Practice mindfulness to improve focus, reduce anxiety, and enhance wellbeing.',
        contentType: 'exercise',
        contentUrl: 'https://example.com/mindfulness',
        riskLevels: ['Low', 'Moderate', 'High', 'Crisis'],
        category: 'Relaxation Techniques',
      },
    ];

    for (const item of content) {
      const contentId = crypto.randomUUID();

      await query(
        `INSERT INTO ginhawa_content
         (content_id, title, description, content_type, content_url, risk_levels, category, status, created_by, published_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', $8, NOW(), NOW())`,
        [
          contentId,
          item.title,
          item.description,
          item.contentType,
          item.contentUrl,
          JSON.stringify(item.riskLevels),
          item.category,
          facilitatorId,
        ]
      );
    }

    console.log('Ginhawa content seeded successfully');
  } catch (error) {
    console.error('Error seeding Ginhawa content:', error);
    throw error;
  }
}

seedGinhawa().then(() => process.exit(0));
