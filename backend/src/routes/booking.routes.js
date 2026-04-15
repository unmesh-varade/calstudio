const express = require('express');

const controller = require('../controllers/booking.controller');
const { validateRequest } = require('../middleware/validate-request');
const {
  bookingIdSchema,
  bookingListQuerySchema,
} = require('../validations/booking.validation');

const router = express.Router();

router.get('/', validateRequest({ query: bookingListQuerySchema }), controller.listBookings);
router.patch(
  '/:id/cancel',
  validateRequest({ params: bookingIdSchema }),
  controller.cancelBooking,
);

module.exports = router;
