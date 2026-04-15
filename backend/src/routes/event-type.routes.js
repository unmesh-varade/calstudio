const express = require('express');

const controller = require('../controllers/event-type.controller');
const { validateRequest } = require('../middleware/validate-request');
const {
  createEventTypeSchema,
  eventTypeIdSchema,
  updateEventTypeSchema,
} = require('../validations/event-type.validation');

const router = express.Router();

router.get('/', controller.listEventTypes);
router.post('/', validateRequest({ body: createEventTypeSchema }), controller.createEventType);
router.patch(
  '/:id',
  validateRequest({ params: eventTypeIdSchema, body: updateEventTypeSchema }),
  controller.updateEventType,
);
router.delete('/:id', validateRequest({ params: eventTypeIdSchema }), controller.deleteEventType);

module.exports = router;
