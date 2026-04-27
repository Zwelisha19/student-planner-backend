const AnalyticsService = require('../services/analyticsService');

// @desc    Get current week analytics dashboard
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const dashboard = await AnalyticsService.getDashboardSummary(req.user.id);
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current week analytics
// @route   GET /api/analytics/current
// @access  Private
const getCurrentWeek = async (req, res) => {
  try {
    const analytics = await AnalyticsService.getCurrentWeekAnalytics(req.user.id);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get analytics for specific week
// @route   GET /api/analytics/week/:date
// @access  Private
const getWeekAnalytics = async (req, res) => {
  try {
    const analytics = await AnalyticsService.getWeekAnalytics(req.user.id, req.params.date);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get trend analytics (last 6 weeks)
// @route   GET /api/analytics/trends
// @access  Private
const getTrends = async (req, res) => {
  try {
    const trends = await AnalyticsService.getTrendAnalytics(req.user.id);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Force recalculate analytics for current week
// @route   POST /api/analytics/recalculate
// @access  Private
const recalculateAnalytics = async (req, res) => {
  try {
    const analytics = await AnalyticsService.calculateWeeklyAnalytics(req.user.id);
    
    res.json({
      success: true,
      message: 'Analytics recalculated successfully',
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getCurrentWeek,
  getWeekAnalytics,
  getTrends,
  recalculateAnalytics
};