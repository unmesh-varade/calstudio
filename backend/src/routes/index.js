const express = require('express');

const { getHealth } = require('../controllers/health.controller');
const availabilityRoutes = require('./availability.routes');
const bookingRoutes = require('./booking.routes');
const eventTypeRoutes = require('./event-type.routes');
const publicRoutes = require('./public.routes');

const router = express.Router();

router.get('/health', getHealth);
router.use('/event-types', eventTypeRoutes);
router.use('/availability', availabilityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/public', publicRoutes);

module.exports = router;
