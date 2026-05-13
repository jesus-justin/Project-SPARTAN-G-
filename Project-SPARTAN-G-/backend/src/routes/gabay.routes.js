import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPopulationDashboard,
  getNotifications,
  getNotificationHistory,
  acknowledgeNotification,
  deleteNotification,
  getStudentDetail,
  // new
  getCaseMapping,
  createAppointment,
  updateAppointmentStatus,
  getAppointments,
  approveAppointment,
  rejectAppointment,
  completeAppointment,
} from '../controllers/gabay.controller.js';

const router = Router();

router.use(requireAuth);

// Population dashboard - aggregated statistics
router.get('/population-dashboard', getPopulationDashboard);

// Notifications endpoints
router.get('/notifications', getNotifications);
router.get('/notifications/history', getNotificationHistory);
router.patch('/notifications/:id/acknowledge', acknowledgeNotification);
router.delete('/notifications/:id', deleteNotification);

// Case mapping: resolve pseudonymous caseId -> SR code (Crisis-only)
router.get('/case-mapping/:caseId', getCaseMapping);

// Student details
router.get('/students/:id', getStudentDetail);

// Appointments
router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.patch('/appointments/:id/approve', approveAppointment);
router.patch('/appointments/:id/reject', rejectAppointment);
router.patch('/appointments/:id/complete', completeAppointment);

export default router;
