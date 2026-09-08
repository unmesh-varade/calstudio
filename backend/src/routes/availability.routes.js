import express from 'express';

import * as controller from '../controllers/availability.controller.js';
import { validateRequest } from '../middleware/validate-request.js';
import { updateAvailabilitySchema } from '../validations/availability.validation.js';

const router = express.Router();

router.get('/', controller.getAvailability);
router.put('/', validateRequest({ body: updateAvailabilitySchema }), controller.updateAvailability);

export default router;
