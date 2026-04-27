const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  metrics: {
    completedAssignments: {
      type: Number,
      default: 0
    },
    totalAssignments: {
      type: Number,
      default: 0
    },
    missedDeadlines: {
      type: Number,
      default: 0
    },
    onTimeSubmissions: {
      type: Number,
      default: 0
    },
    totalStudyHours: {
      type: Number,
      default: 0
    },
    plannedStudyHours: {
      type: Number,
      default: 0
    },
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  productivityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  weeklyTrend: {
    type: String,
    enum: ['improving', 'declining', 'stable', 'new'],
    default: 'new'
  },
  recommendations: [{
    type: String
  }]
}, {
  timestamps: true
});

// Ensure one analytics per user per week
analyticsSchema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);