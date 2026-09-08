import express from 'express';

import * as controller from '../controllers/event-type.controller.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  createEventTypeSchema,
  eventTypeIdSchema,
  updateEventTypeSchema,
} from '../validations/event-type.validation.js';

const router = express.Router();

router.get('/', controller.listEventTypes);
router.post('/', validateRequest({ body: createEventTypeSchema }), controller.createEventType);
router.patch(
  '/:id',
  validateRequest({ params: eventTypeIdSchema, body: updateEventTypeSchema }),
  controller.updateEventType,
);
router.delete('/:id', validateRequest({ params: eventTypeIdSchema }), controller.deleteEventType);

export default router;
