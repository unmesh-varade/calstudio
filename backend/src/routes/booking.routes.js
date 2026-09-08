import express from 'express';

import * as controller from '../controllers/booking.controller.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  bookingIdSchema,
  bookingListQuerySchema,
  publicSlotsQuerySchema,
  requestRescheduleBodySchema,
  rescheduleBookingBodySchema,
} from '../validations/booking.validation.js';

const router = express.Router();

router.get('/', validateRequest({ query: bookingListQuerySchema }), controller.listBookings);
router.get('/:id', validateRequest({ params: bookingIdSchema }), controller.getBooking);
router.get(
  '/:id/reschedule/slots',
  validateRequest({ params: bookingIdSchema, query: publicSlotsQuerySchema }),
  controller.getBookingRescheduleSlots,
);
router.post(
  '/:id/reschedule',
  validateRequest({ params: bookingIdSchema, body: rescheduleBookingBodySchema }),
  controller.rescheduleBooking,
);
router.post(
  '/:id/request-reschedule',
  validateRequest({ params: bookingIdSchema, body: requestRescheduleBodySchema }),
  controller.requestRescheduleBooking,
);
router.patch(
  '/:id/cancel',
  validateRequest({ params: bookingIdSchema, body: requestRescheduleBodySchema }),
  controller.cancelBooking,
);

export default router;
