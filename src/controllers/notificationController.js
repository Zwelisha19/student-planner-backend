const NotificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });
    
    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get unread notifications only
// @route   GET /api/notifications/unread
// @access  Private
const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await NotificationService.getUnreadNotifications(req.user.id);
    
    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Trigger due assignment check (manual)
// @route   POST /api/notifications/check-due
// @access  Private (admin only maybe)
const checkDueAssignments = async (req, res) => {
  try {
    const count = await NotificationService.checkDueAssignments();
    
    res.json({
      success: true,
      message: `Checked assignments. ${count} due soon notifications sent.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Trigger daily summary for current user
// @route   POST /api/notifications/daily-summary
// @access  Private
const sendDailySummary = async (req, res) => {
  try {
    await NotificationService.sendDailySummary(req.user.id);
    
    res.json({
      success: true,
      message: 'Daily summary sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  checkDueAssignments,
  sendDailySummary
};
