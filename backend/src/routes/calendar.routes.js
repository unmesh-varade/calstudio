import express from 'express';

import {
  getDailyScheduleController,
  getDailySummaryController,
} from '../controllers/calendar.controller.js';

const router = express.Router();

router.get('/today', getDailyScheduleController);
router.get('/today/summary', getDailySummaryController);

export default router;
