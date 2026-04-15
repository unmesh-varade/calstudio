const express = require('express');

const controller = require('../controllers/booking.controller');
const { validateRequest } = require('../middleware/validate-request');
const {
  bookingIdSchema,
  bookingListQuerySchema,
  publicSlotsQuerySchema,
  requestRescheduleBodySchema,
  rescheduleBookingBodySchema,
} = require('../validations/booking.validation');

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
  validateRequest({ params: bookingIdSchema }),
  controller.cancelBooking,
);

module.exports = router;
