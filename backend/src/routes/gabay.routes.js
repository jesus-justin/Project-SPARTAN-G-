import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPopulationDashboard,
  getNotifications,
  acknowledgeNotification,
  getStudentDetail,
  createAppointment,
  updateAppointmentStatus,
  getAppointments,
} from '../controllers/gabay.controller.js';

const router = Router();

router.use(requireAuth);

// Population dashboard - aggregated statistics
router.get('/population-dashboard', getPopulationDashboard);

// Notifications endpoints
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/acknowledge', acknowledgeNotification);

// Student details
router.get('/students/:id', getStudentDetail);

// Appointments
router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
router.patch('/appointments/:id/status', updateAppointmentStatus);

export default router;
