const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getDashboard,
  getCurrentWeek,
  getWeekAnalytics,
  getTrends,
  recalculateAnalytics
} = require('../controllers/analyticsController');

const router = express.Router();

// All routes are protected
router.get('/dashboard', protect, getDashboard);
router.get('/current', protect, getCurrentWeek);
router.get('/trends', protect, getTrends);
router.get('/week/:date', protect, getWeekAnalytics);
router.post('/recalculate', protect, recalculateAnalytics);

module.exports = router;