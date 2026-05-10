import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import ogcRoutes from './routes/ogc.routes.js';
import gabayRoutes from './routes/gabay.routes.js';
import ginhawaRoutes from './routes/ginhawa.routes.js';
import predictionRoutes from './routes/prediction.routes.js';
import { env } from './config/env.js';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      // Allow local development origins with dynamic ports (Flutter web, Vite, etc.)
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      if (env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS policy'));
    },
  })
);

// Health endpoints: respond for GET (used by uptime checks) and POST (legacy/client)
app.get('/api/health', (_req, res) => {
  return res.json({ success: true, status: 'ok' });
});

app.post('/api/health', (_req, res) => {
  return res.json({ success: true, status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/ogc', ogcRoutes);
app.use('/api/gabay', gabayRoutes);
app.use('/api/ginhawa', ginhawaRoutes);
app.use('/api/predictions', predictionRoutes);

app.use((req, res) => {
  return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;
