import express from 'express';

import * as controller from '../controllers/public.controller.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  createPublicBookingSchema,
  manageTokenQuerySchema,
  publicCancelBookingBodySchema,
  publicBookingConfirmationParamsSchema,
  publicBookingConfirmationQuerySchema,
  publicProfileParamsSchema,
  publicSlugParamsSchema,
  publicSlotsQuerySchema,
  rescheduleBookingBodySchema,
} from '../validations/booking.validation.js';

const router = express.Router();

router.get(
  '/profiles/:username',
  validateRequest({ params: publicProfileParamsSchema }),
  controller.getPublicProfile,
);
router.get(
  '/profiles/:username/event-types/:slug',
  validateRequest({ params: publicSlugParamsSchema }),
  controller.getPublicEventType,
);
router.get(
  '/profiles/:username/event-types/:slug/slots',
  validateRequest({ params: publicSlugParamsSchema, query: publicSlotsQuerySchema }),
  controller.getPublicSlots,
);
router.get(
  '/bookings/:bookingId',
  validateRequest({
    params: publicBookingConfirmationParamsSchema,
    query: publicBookingConfirmationQuerySchema,
  }),
  controller.getPublicBookingConfirmation,
);
router.get(
  '/bookings/:bookingId/manage',
  validateRequest({
    params: publicBookingConfirmationParamsSchema,
    query: manageTokenQuerySchema,
  }),
  controller.getPublicManageBooking,
);
router.get(
  '/bookings/:bookingId/reschedule/slots',
  validateRequest({
    params: publicBookingConfirmationParamsSchema,
    query: manageTokenQuerySchema.merge(publicSlotsQuerySchema),
  }),
  controller.getPublicRescheduleSlots,
);
router.post(
  '/bookings/:bookingId/reschedule',
  validateRequest({
    params: publicBookingConfirmationParamsSchema,
    query: manageTokenQuerySchema,
    body: rescheduleBookingBodySchema,
  }),
  controller.reschedulePublicBooking,
);
router.post(
  '/bookings/:bookingId/cancel',
  validateRequest({
    params: publicBookingConfirmationParamsSchema,
    query: manageTokenQuerySchema,
    body: publicCancelBookingBodySchema,
  }),
  controller.cancelPublicBooking,
);
router.post(
  '/bookings',
  validateRequest({ body: createPublicBookingSchema }),
  controller.createPublicBooking,
);

export default router;
