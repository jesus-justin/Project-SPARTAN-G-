import { query } from '../config/db.js';
import { scoreDASS21 } from '../services/dass21.service.js';
import { classifyDASSRisk } from '../services/riskClassifier.service.js';
import { emitOgcEvent } from '../services/ogcRealtime.service.js';

export async function submitDass21(req, res, next) {
  try {
    const { answers } = req.body;
    const scoring = scoreDASS21(answers);
    const riskLevel = classifyDASSRisk(scoring);

    const result = await query(
      `INSERT INTO dass21_assessments
       (user_id, answers, depression_score, anxiety_score, stress_score, total_score, risk_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        req.user.id,
        JSON.stringify(answers),
        scoring.depression,
        scoring.anxiety,
        scoring.stress,
        scoring.totalScore,
        riskLevel,
      ]
    );

    if (riskLevel === 'High' || riskLevel === 'Crisis') {
      await query(
        `CREATE TABLE IF NOT EXISTS ogc_notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT,
          facilitator_user_id INT NULL,
          risk_level VARCHAR(32) NULL,
          title VARCHAR(255),
          body TEXT,
          seen TINYINT(1) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      );

      const facilitatorRes = await query(
        `SELECT id FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1`,
        ['facilitator']
      );
      const facilitatorId = facilitatorRes.rowCount > 0 ? facilitatorRes.rows[0].id : null;

      await query(
        `INSERT INTO ogc_notifications (student_id, facilitator_user_id, risk_level, title, body, seen)
         VALUES ($1, $2, $3, $4, $5, 0)`,
        [
          req.user.id,
          facilitatorId,
          riskLevel,
          `${riskLevel} Risk Alert`,
          `A student was classified as ${riskLevel} risk after completing DASS-21.`,
        ]
      );

      emitOgcEvent('dashboard-updated', {
        source: 'dass21',
        studentId: req.user.id,
        riskLevel,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        assessmentId: result.rows[0].id,
        submittedAt: result.rows[0].created_at,
        scoring,
        riskLevel,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getLatestDass21(req, res, next) {
  try {
    const result = await query(
      `SELECT id, answers, depression_score, anxiety_score, stress_score, total_score, risk_level, created_at
       FROM dass21_assessments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'No DASS-21 records found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function getDass21Questions(_req, res) {
  const questions = [
    'I found it hard to wind down',
    'I was aware of dryness of my mouth',
    'I couldn\'t seem to experience any positive feeling at all',
    'I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion)',
    'I found it difficult to work up the initiative to do things',
    'I tended to over-react to situations',
    'I experienced trembling (e.g., in the hands)',
    'I felt that I was using a lot of nervous energy',
    'I was worried about situations in which I might panic and make a fool of myself',
    'I felt that I had nothing to look forward to',
    'I found myself getting agitated',
    'I found it difficult to relax',
    'I felt down-hearted and blue',
    'I was intolerant of anything that kept me from getting on with what I was doing',
    'I felt I was close to panic',
    'I was unable to become enthusiastic about anything',
    'I felt I wasn\'t worth much as a person',
    'I felt that I was rather touchy',
    'I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat)',
    'I felt scared without any good reason',
    'I felt that life was meaningless'
  ];

  return res.json({ success: true, data: questions });
}
