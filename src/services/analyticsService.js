const Analytics = require('../models/Analytics');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

class AnalyticsService {
  
  // Calculate weekly analytics for a user
  static async calculateWeeklyAnalytics(userId, targetDate = new Date()) {
    try {
      // Get start and end of week (Monday to Sunday)
      const weekStart = this.getStartOfWeek(targetDate);
      const weekEnd = this.getEndOfWeek(targetDate);
      
      // Get all assignments for this week
      const assignments = await Assignment.find({
        user: userId,
        createdAt: { $lte: weekEnd },
        dueDate: { $gte: weekStart }
      });
      
      // Calculate metrics
      const totalAssignments = assignments.length;
      const completedAssignments = assignments.filter(a => a.status === 'Done').length;
      
      // Calculate missed deadlines (assignments past due date that are not done)
      const now = new Date();
      const missedDeadlines = assignments.filter(a => {
        return a.status !== 'Done' && a.dueDate < now;
      }).length;
      
      // Calculate on-time submissions
      const onTimeSubmissions = assignments.filter(a => {
        if (a.status === 'Done' && a.completedAt) {
          return a.completedAt <= a.dueDate;
        }
        return false;
      }).length;
      
      // Calculate completion rate
      const completionRate = totalAssignments > 0 
        ? (completedAssignments / totalAssignments) * 100 
        : 0;
      
      // Calculate consistency score (based on daily study)
      const consistencyScore = await this.calculateConsistencyScore(userId, weekStart, weekEnd);
      
      // Calculate productivity score
      const productivityScore = this.calculateProductivityScore({
        completionRate,
        onTimeSubmissions,
        missedDeadlines,
        consistencyScore,
        totalAssignments
      });
      
      // Generate recommendations
      const recommendations = this.generateRecommendations({
        completionRate,
        missedDeadlines,
        onTimeSubmissions,
        consistencyScore,
        totalAssignments
      });
      
      // Determine trend (compare with previous week)
      const previousWeekAnalytics = await Analytics.findOne({
        user: userId,
        weekStart: this.getStartOfWeek(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))
      });
      
      let weeklyTrend = 'new';
      if (previousWeekAnalytics) {
        if (productivityScore > previousWeekAnalytics.productivityScore) {
          weeklyTrend = 'improving';
        } else if (productivityScore < previousWeekAnalytics.productivityScore) {
          weeklyTrend = 'declining';
        } else {
          weeklyTrend = 'stable';
        }
      }
      
      // Create or update analytics record
      const analytics = await Analytics.findOneAndUpdate(
        { user: userId, weekStart },
        {
          user: userId,
          weekStart,
          weekEnd,
          metrics: {
            completedAssignments,
            totalAssignments,
            missedDeadlines,
            onTimeSubmissions,
            totalStudyHours: 0,
            plannedStudyHours: 0,
            consistencyScore
          },
          productivityScore,
          weeklyTrend,
          recommendations
        },
        { upsert: true, new: true }
      );
      
      return analytics;
      
    } catch (error) {
      console.error('Analytics calculation error:', error);
      throw error;
    }
  }
  
  // Calculate consistency score (how often they study)
  static async calculateConsistencyScore(userId, weekStart, weekEnd) {
    const assignments = await Assignment.find({
      user: userId,
      createdAt: { $gte: weekStart, $lte: weekEnd }
    });
    
    if (assignments.length === 0) return 0;
    
    const completedOnTime = assignments.filter(a => {
      if (a.status === 'Done' && a.completedAt) {
        return a.completedAt <= a.dueDate;
      }
      return false;
    }).length;
    
    return (completedOnTime / assignments.length) * 100;
  }
  
  // Calculate productivity score (0-100)
  static calculateProductivityScore(metrics) {
    let score = 0;
    
    // Completion rate (40% weight)
    score += (metrics.completionRate || 0) * 0.4;
    
    // On-time submissions (30% weight)
    if (metrics.totalAssignments > 0) {
      const onTimeRate = (metrics.onTimeSubmissions / metrics.totalAssignments) * 100;
      score += onTimeRate * 0.3;
    }
    
    // Consistency score (20% weight)
    score += (metrics.consistencyScore || 0) * 0.2;
    
    // Missed deadlines penalty (10% weight)
    const missedPenalty = Math.max(0, 100 - (metrics.missedDeadlines * 20));
    score += missedPenalty * 0.1;
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }
  
  // Generate personalized recommendations
  static generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.completionRate < 50) {
      recommendations.push('⚠️ You\'re falling behind. Try breaking tasks into smaller chunks.');
    } else if (metrics.completionRate < 80) {
      recommendations.push('📈 Good progress! Focus on completing pending assignments.');
    } else {
      recommendations.push('🎉 Excellent completion rate! Keep up the great work!');
    }
    
    if (metrics.missedDeadlines > 2) {
      recommendations.push('⏰ You have missed several deadlines. Try setting earlier reminders.');
    } else if (metrics.missedDeadlines > 0) {
      recommendations.push('📅 Set calendar reminders to avoid missing deadlines.');
    }
    
    if (metrics.consistencyScore < 50) {
      recommendations.push('📚 Try to study at the same time every day to build a habit.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🌟 You\'re doing great! Keep maintaining your study routine.');
    }
    
    return recommendations;
  }
  
  // Get analytics for current week
  static async getCurrentWeekAnalytics(userId) {
    const weekStart = this.getStartOfWeek(new Date());
    let analytics = await Analytics.findOne({ user: userId, weekStart });
    
    if (!analytics) {
      analytics = await this.calculateWeeklyAnalytics(userId);
    }
    
    return analytics;
  }
  
  // Get analytics for a specific week
  static async getWeekAnalytics(userId, date) {
    const weekStart = this.getStartOfWeek(new Date(date));
    let analytics = await Analytics.findOne({ user: userId, weekStart });
    
    if (!analytics) {
      analytics = await this.calculateWeeklyAnalytics(userId, date);
    }
    
    return analytics;
  }
  
  // Get last 6 weeks of analytics (trend data)
  static async getTrendAnalytics(userId) {
    const trends = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (i * 7));
      const weekStart = this.getStartOfWeek(date);
      
      let analytics = await Analytics.findOne({ user: userId, weekStart });
      
      if (!analytics && i === 0) {
        analytics = await this.calculateWeeklyAnalytics(userId, date);
      } else if (!analytics) {
        analytics = {
          weekStart,
          productivityScore: 0,
          metrics: { completedAssignments: 0, totalAssignments: 0 }
        };
      }
      
      trends.push({
        weekStart: analytics.weekStart,
        productivityScore: analytics.productivityScore || 0,
        completionRate: analytics.metrics?.totalAssignments > 0 
          ? (analytics.metrics.completedAssignments / analytics.metrics.totalAssignments) * 100 
          : 0,
        totalTasks: analytics.metrics?.totalAssignments || 0
      });
    }
    
    return trends.reverse();
  }
  
  // Get dashboard summary (all stats in one place)
  static async getDashboardSummary(userId) {
    const currentWeek = await this.getCurrentWeekAnalytics(userId);
    const trends = await this.getTrendAnalytics(userId);
    
    // Get pending assignments count
    const pendingCount = await Assignment.countDocuments({
      user: userId,
      status: { $ne: 'Done' }
    });
    
    // Get urgent assignments (due in 2 days)
    const today = new Date();
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);
    
    const urgentCount = await Assignment.countDocuments({
      user: userId,
      status: { $ne: 'Done' },
      dueDate: { $lte: twoDaysFromNow }
    });
    
    // Calculate average productivity
    const avgProductivity = trends.reduce((sum, t) => sum + t.productivityScore, 0) / trends.length;
    
    return {
      currentWeek: {
        productivityScore: currentWeek?.productivityScore || 0,
        completedTasks: currentWeek?.metrics?.completedAssignments || 0,
        totalTasks: currentWeek?.metrics?.totalAssignments || 0,
        missedDeadlines: currentWeek?.metrics?.missedDeadlines || 0,
        consistencyScore: currentWeek?.metrics?.consistencyScore || 0,
        recommendations: currentWeek?.recommendations || []
      },
      overview: {
        pendingTasks: pendingCount,
        urgentTasks: urgentCount,
        averageProductivity: Math.round(avgProductivity)
      },
      trends: trends,
      productivityLevel: this.getProductivityLevel(currentWeek?.productivityScore || 0)
    };
  }
  
  // Get productivity level label
  static getProductivityLevel(score) {
    if (score >= 90) return { label: 'Excellent', color: '#4CAF50', icon: '🌟' };
    if (score >= 75) return { label: 'Good', color: '#8BC34A', icon: '📈' };
    if (score >= 60) return { label: 'Satisfactory', color: '#FFC107', icon: '📊' };
    if (score >= 40) return { label: 'Needs Improvement', color: '#FF9800', icon: '⚠️' };
    return { label: 'Poor', color: '#F44336', icon: '❌' };
  }
  
  // Helper: Get start of week (Monday)
  static getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  
  // Helper: Get end of week (Sunday)
  static getEndOfWeek(date) {
    const start = this.getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}

module.exports = AnalyticsService;