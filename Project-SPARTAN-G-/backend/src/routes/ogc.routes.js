import { Router } from 'express';
import {
  getNotifications,
  acknowledgeNotification,
  getStudent,
  streamDashboardUpdates,
  getAvailabilitySlots,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getEmergencyContacts,
  createEmergencyContact,
  deleteEmergencyContact,
} from '../controllers/ogc.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/stream', requireAuth, streamDashboardUpdates);
router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/:id/acknowledge', requireAuth, acknowledgeNotification);
router.get('/students/:id', requireAuth, getStudent);

// Availability Slots
router.get('/availability/slots', requireAuth, getAvailabilitySlots);
router.post('/availability/slots', requireAuth, createAvailabilitySlot);
router.delete('/availability/slots/:slotId', requireAuth, deleteAvailabilitySlot);

// Emergency Contacts
router.get('/emergency-contacts', requireAuth, getEmergencyContacts);
router.post('/emergency-contacts', requireAuth, createEmergencyContact);
router.delete('/emergency-contacts/:contactId', requireAuth, deleteEmergencyContact);

export default router;
