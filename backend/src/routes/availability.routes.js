const express = require('express');

const controller = require('../controllers/availability.controller');
const { validateRequest } = require('../middleware/validate-request');
const { updateAvailabilitySchema } = require('../validations/availability.validation');

const router = express.Router();

router.get('/', controller.getAvailability);
router.put('/', validateRequest({ body: updateAvailabilitySchema }), controller.updateAvailability);

module.exports = router;
