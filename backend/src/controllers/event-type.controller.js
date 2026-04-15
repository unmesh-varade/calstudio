const eventTypeService = require('../services/event-type.service');

async function listEventTypes(req, res) {
  const data = await eventTypeService.listEventTypes();
  res.json({ data });
}

async function createEventType(req, res) {
  const data = await eventTypeService.createEventType(req.validated.body);
  res.status(201).json({ data });
}

async function updateEventType(req, res) {
  const data = await eventTypeService.updateEventType(
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data });
}

async function deleteEventType(req, res) {
  const data = await eventTypeService.deleteEventType(req.validated.params.id);
  res.json({ data });
}

module.exports = {
  createEventType,
  deleteEventType,
  listEventTypes,
  updateEventType,
};
