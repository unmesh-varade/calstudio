import eventTypeService from '../services/event-type.service.js';

export async function listEventTypes(req, res) {
  const data = await eventTypeService.listEventTypes();
  res.json({ data });
}

export async function createEventType(req, res) {
  const data = await eventTypeService.createEventType(req.validated.body);
  res.status(201).json({ data });
}

export async function updateEventType(req, res) {
  const data = await eventTypeService.updateEventType(
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data });
}

export async function deleteEventType(req, res) {
  const data = await eventTypeService.deleteEventType(req.validated.params.id);
  res.json({ data });
}

export default {
  createEventType,
  deleteEventType,
  listEventTypes,
  updateEventType,
};
