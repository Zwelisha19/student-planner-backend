const cron = require('node-cron');
const NotificationService = require('../services/notificationService');

// Schedule job to run every day at 8:00 AM
const startReminderJobs = () => {
  
  // Check due assignments every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('🕐 Running due assignment check...');
    await NotificationService.checkDueAssignments();
  });
  
  // Send daily summaries every day at 7:00 PM
  cron.schedule('0 19 * * *', async () => {
    console.log('🕐 Sending daily summaries...');
    await NotificationService.sendDailySummariesToAllUsers();
  });
  
  // Check assignments again at 12:00 PM (noon)
  cron.schedule('0 12 * * *', async () => {
    console.log('🕐 Mid-day assignment check...');
    await NotificationService.checkDueAssignments();
  });
  
  console.log('✅ Notification jobs scheduled');
};

module.exports = startReminderJobs;