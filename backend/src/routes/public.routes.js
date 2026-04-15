const express = require('express');

const controller = require('../controllers/public.controller');
const { validateRequest } = require('../middleware/validate-request');
const {
  createPublicBookingSchema,
  publicBookingConfirmationParamsSchema,
  publicBookingConfirmationQuerySchema,
  publicProfileParamsSchema,
  publicSlugParamsSchema,
  publicSlotsQuerySchema,
} = require('../validations/booking.validation');

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
router.post(
  '/bookings',
  validateRequest({ body: createPublicBookingSchema }),
  controller.createPublicBooking,
);

module.exports = router;
