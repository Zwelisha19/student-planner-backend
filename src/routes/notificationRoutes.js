const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  checkDueAssignments,
  sendDailySummary
} = require('../controllers/notificationController');

const router = express.Router();

// All routes are protected
router.get('/', protect, getNotifications);
router.get('/unread', protect, getUnreadNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.post('/check-due', protect, checkDueAssignments);
router.post('/daily-summary', protect, sendDailySummary);

module.exports = router;