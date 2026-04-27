const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getTodayPlan,
  getPlanForDate,
  getWeeklyPlan,
  getPriorities
} = require('../controllers/studyPlanController');

const router = express.Router();

// All routes are protected
router.get('/today', protect, getTodayPlan);
router.get('/weekly', protect, getWeeklyPlan);
router.get('/priorities', protect, getPriorities);
router.get('/date/:date', protect, getPlanForDate);

module.exports = router;