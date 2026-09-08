import express from 'express';

import { getHealth } from '../controllers/health.controller.js';
import availabilityRoutes from './availability.routes.js';
import bookingRoutes from './booking.routes.js';
import eventTypeRoutes from './event-type.routes.js';
import publicRoutes from './public.routes.js';

const router = express.Router();

router.get('/health', getHealth);
router.use('/event-types', eventTypeRoutes);
router.use('/availability', availabilityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/public', publicRoutes);

export default router;
