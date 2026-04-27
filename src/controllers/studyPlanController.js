const StudyEngine = require('../services/studyEngine');
const Assignment = require('../models/Assignment');

// @desc    Get today's study plan
// @route   GET /api/studyplan/today
// @access  Private
const getTodayPlan = async (req, res) => {
  try {
    const plan = await StudyEngine.generateDailyPlan(req.user.id, new Date());
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get study plan for specific date
// @route   GET /api/studyplan/date/:date
// @access  Private
const getPlanForDate = async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    const plan = await StudyEngine.generateDailyPlan(req.user.id, targetDate);
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get weekly study plan (7 days)
// @route   GET /api/studyplan/weekly
// @access  Private
const getWeeklyPlan = async (req, res) => {
  try {
    const weeklyPlan = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const plan = await StudyEngine.generateDailyPlan(req.user.id, date);
      weeklyPlan.push(plan);
    }
    
    res.json({
      success: true,
      data: weeklyPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get study priorities (all assignments ranked)
// @route   GET /api/studyplan/priorities
// @access  Private
const getPriorities = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      user: req.user.id,
      status: { $ne: 'Done' }
    });
    
    const prioritized = StudyEngine.calculatePriority(assignments);
    
    res.json({
      success: true,
      count: prioritized.length,
      data: prioritized
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getTodayPlan,
  getPlanForDate,
  getWeeklyPlan,
  getPriorities
};