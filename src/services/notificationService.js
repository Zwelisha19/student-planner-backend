const brevo = require('@getbrevo/brevo');
const Notification = require('../models/Notification');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

// Initialize Brevo API
let apiClient = null;
let apiKey = null;

try {
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your_brevo_api_key_here') {
    apiClient = new brevo.TransactionalEmailsApi();
    apiKey = apiClient.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    console.log('✅ Brevo email service initialized');
  } else {
    console.log('⚠️ Brevo API key not configured. Email notifications disabled.');
  }
} catch (error) {
  console.log('⚠️ Brevo not configured. Email notifications disabled.');
}

class NotificationService {
  
  // Send email via Brevo
  static async sendEmail(to, subject, content) {
    if (!apiClient) {
      console.log('Email skipped: Brevo not configured');
      return false;
    }
    
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.sender = { 
        email: process.env.BREVO_EMAIL || 'noreply@studentplanner.com',
        name: 'Student Planner'
      };
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = content;
      
      const response = await apiClient.sendTransacEmail(sendSmtpEmail);
      console.log(`📧 Email sent to ${to}: ${response.response.statusCode}`);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }
  
  // Create in-app notification
  static async createInAppNotification(userId, type, title, message, data = {}) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        data,
        deliveredVia: ['inapp']
      });
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }
  
  // Check for due assignments and send reminders
  static async checkDueAssignments() {
    try {
      const today = new Date();
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(today.getDate() + 2);
      
      // Find assignments due in next 2 days that aren't completed
      const dueAssignments = await Assignment.find({
        status: { $ne: 'Done' },
        dueDate: {
          $gte: today,
          $lte: twoDaysFromNow
        }
      }).populate('user');
      
      for (const assignment of dueAssignments) {
        const daysUntilDue = Math.ceil((assignment.dueDate - today) / (1000 * 60 * 60 * 24));
        
        let urgencyText = '';
        if (daysUntilDue <= 0) urgencyText = 'DUE TODAY!';
        else if (daysUntilDue === 1) urgencyText = 'Due Tomorrow!';
        else urgencyText = `Due in ${daysUntilDue} days`;
        
        // Create in-app notification
        await this.createInAppNotification(
          assignment.user._id,
          'assignment_due',
          `📚 ${urgencyText}: ${assignment.title}`,
          `${assignment.subject} - ${urgencyText}. Estimated time: ${assignment.estimatedHours} hours`,
          { assignmentId: assignment._id, dueDate: assignment.dueDate }
        );
        
        // Send email if user has email
        if (assignment.user.email) {
          const emailContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #ff4444;">⚠️ Assignment Reminder</h2>
              <p><strong>${assignment.title}</strong></p>
              <p><strong>Subject:</strong> ${assignment.subject}</p>
              <p><strong>Status:</strong> ${urgencyText}</p>
              <p><strong>Estimated hours:</strong> ${assignment.estimatedHours}</p>
              <hr>
              <p>Open your Student Planner app to mark this as complete.</p>
            </div>
          `;
          
          await this.sendEmail(
            assignment.user.email,
            `[Student Planner] ${urgencyText}: ${assignment.title}`,
            emailContent
          );
        }
      }
      
      console.log(`✅ Checked assignments: ${dueAssignments.length} due soon`);
      return dueAssignments.length;
    } catch (error) {
      console.error('Error checking due assignments:', error);
      return 0;
    }
  }
  
  // Send daily study summary
  static async sendDailySummary(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;
      
      // Get pending assignments
      const pendingAssignments = await Assignment.find({
        user: userId,
        status: { $ne: 'Done' }
      }).sort({ dueDate: 1 });
      
      if (pendingAssignments.length === 0) {
        await this.createInAppNotification(
          userId,
          'daily_summary',
          '🎉 Great job!',
          'You have no pending assignments. Enjoy your day!',
          {}
        );
        return true;
      }
      
      const urgentCount = pendingAssignments.filter(a => {
        const daysUntilDue = Math.ceil((a.dueDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 2;
      }).length;
      
      const totalHours = pendingAssignments.reduce((sum, a) => sum + a.estimatedHours, 0);
      
      // Create in-app summary
      await this.createInAppNotification(
        userId,
        'daily_summary',
        '📋 Daily Study Summary',
        `You have ${pendingAssignments.length} pending assignment(s). ${urgentCount} urgent. Total estimated: ${totalHours} hours.`,
        { pendingCount: pendingAssignments.length, urgentCount, totalHours }
      );
      
      // Send email summary
      if (user.email) {
        const assignmentList = pendingAssignments.map(a => `
          <li><strong>${a.title}</strong> (${a.subject}) - Due: ${a.dueDate.toLocaleDateString()}</li>
        `).join('');
        
        const emailContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>📚 Your Daily Study Summary</h2>
            <p>Hello ${user.name},</p>
            <p>You have <strong>${pendingAssignments.length}</strong> pending assignment(s):</p>
            <ul>${assignmentList}</ul>
            <p><strong>Total estimated study time:</strong> ${totalHours} hours</p>
            <p><strong>Urgent tasks:</strong> ${urgentCount}</p>
            <hr>
            <p>Open your Student Planner app to view your personalized study plan.</p>
          </div>
        `;
        
        await this.sendEmail(
          user.email,
          `[Student Planner] Daily Summary: ${pendingAssignments.length} pending assignments`,
          emailContent
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error sending daily summary:', error);
      return false;
    }
  }
  
  // Send daily summaries to ALL users (cron job)
  static async sendDailySummariesToAllUsers() {
    try {
      const users = await User.find({});
      let count = 0;
      
      for (const user of users) {
        await this.sendDailySummary(user._id);
        count++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`✅ Sent daily summaries to ${count} users`);
      return count;
    } catch (error) {
      console.error('Error sending batch summaries:', error);
      return 0;
    }
  }
  
  // Get unread notifications for user
  static async getUnreadNotifications(userId) {
    return await Notification.find({
      user: userId,
      isRead: false
    }).sort({ createdAt: -1 });
  }
  
  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
  }
  
  // Mark all notifications as read
  static async markAllAsRead(userId) {
    return await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
  }
}

module.exports = NotificationService;
