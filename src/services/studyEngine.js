const Assignment = require('../models/Assignment');
const Timetable = require('../models/Timetable');

class StudyEngine {
  // Main method to generate daily study plan
  static async generateDailyPlan(userId, targetDate = new Date()) {
    try {
      // 1. Get all pending assignments
      const assignments = await Assignment.find({
        user: userId,
        status: { $ne: 'Done' }  // Not completed
      }).sort({ dueDate: 1 });

      if (assignments.length === 0) {
        return {
          success: true,
          message: 'No pending assignments! Great job! 🎉',
          tasks: []
        };
      }

      // 2. Get user's timetable for the target date
      const dayOfWeek = targetDate.getDay();
      const classes = await Timetable.find({
        user: userId,
        dayOfWeek: dayOfWeek
      });

      // 3. Calculate available study hours
      const availableHours = await this.calculateAvailableHours(classes, targetDate);
      
      if (availableHours === 0) {
        return {
          success: true,
          message: 'You have classes all day. No study time available.',
          tasks: []
        };
      }

      // 4. Calculate priority and urgency for each assignment
      const prioritizedAssignments = this.calculatePriority(assignments);
      
      // 5. Allocate study time based on priority
      const studyTasks = this.allocateStudyTime(prioritizedAssignments, availableHours);
      
      // 6. Generate schedule with time slots
      const scheduledTasks = this.scheduleTasks(studyTasks, classes, targetDate);
      
      return {
        success: true,
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek: this.getDayName(dayOfWeek),
        totalStudyHours: scheduledTasks.reduce((sum, task) => sum + task.allocatedHours, 0),
        availableHours: availableHours,
        tasks: scheduledTasks,
        summary: this.generateSummary(scheduledTasks, assignments.length)
      };
      
    } catch (error) {
      console.error('Study Engine Error:', error);
      throw error;
    }
  }

  // Calculate available study hours (excluding class times)
  static async calculateAvailableHours(classes, date) {
    // Default study window: 8 AM to 10 PM (14 hours)
    const STUDY_START = 8;
    const STUDY_END = 22;
    
    let busySlots = [];
    
    // Add class times to busy slots
    classes.forEach(classItem => {
      const startHour = parseInt(classItem.startTime.split(':')[0]);
      const endHour = parseInt(classItem.endTime.split(':')[0]);
      busySlots.push({ start: startHour, end: endHour });
    });
    
    // Calculate total busy hours
    let busyHours = 0;
    busySlots.forEach(slot => {
      busyHours += (slot.end - slot.start);
    });
    
    // Available hours = total study window - busy hours
    let availableHours = (STUDY_END - STUDY_START) - busyHours;
    
    // Cap at user's preferred hours (from User model)
    // Default to 4 hours if not set
    return Math.min(availableHours, 4);
  }

  // Calculate priority based on due date
  static calculatePriority(assignments) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return assignments.map(assignment => {
      const dueDate = new Date(assignment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      let priorityScore = 0;
      let urgency = '';
      
      if (daysUntilDue < 0) {
        priorityScore = 100; // Overdue
        urgency = 'OVERDUE!';
      } else if (daysUntilDue <= 2) {
        priorityScore = 90;
        urgency = 'URGENT';
      } else if (daysUntilDue <= 5) {
        priorityScore = 70;
        urgency = 'High';
      } else if (daysUntilDue <= 10) {
        priorityScore = 50;
        urgency = 'Medium';
      } else {
        priorityScore = 30;
        urgency = 'Low';
      }
      
      // Add weight for estimated hours (shorter tasks get higher priority)
      const hoursWeight = Math.max(0, (5 - assignment.estimatedHours) / 5) * 10;
      priorityScore += hoursWeight;
      
      return {
        ...assignment.toObject(),
        daysUntilDue,
        priorityScore,
        urgency
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Allocate study time to assignments based on priority
  static allocateStudyTime(prioritizedAssignments, availableHours) {
    let remainingHours = availableHours;
    const tasks = [];
    
    for (const assignment of prioritizedAssignments) {
      if (remainingHours <= 0) break;
      
      // Calculate needed hours (estimated hours remaining)
      let neededHours = assignment.estimatedHours;
      
      // For assignments with high urgency, allocate more time
      let allocation = Math.min(neededHours, remainingHours);
      
      // Cap at 3 hours per assignment per day
      allocation = Math.min(allocation, 3);
      
      if (allocation > 0) {
        tasks.push({
          assignmentId: assignment._id,
          title: assignment.title,
          subject: assignment.subject,
          dueDate: assignment.dueDate,
          daysUntilDue: assignment.daysUntilDue,
          urgency: assignment.urgency,
          estimatedHours: assignment.estimatedHours,
          allocatedHours: Math.round(allocation * 10) / 10,
          priority: assignment.priority
        });
        
        remainingHours -= allocation;
      }
    }
    
    return tasks;
  }

  // Schedule tasks into specific time slots
  static scheduleTasks(tasks, classes, date) {
    const STUDY_START = 8;
    const STUDY_END = 22;
    
    // Get busy hours from classes
    const busyHours = classes.map(c => ({
      start: parseInt(c.startTime.split(':')[0]),
      end: parseInt(c.endTime.split(':')[0])
    }));
    
    const scheduledTasks = [];
    let currentHour = STUDY_START;
    
    for (const task of tasks) {
      let hoursToSchedule = task.allocatedHours;
      let taskSchedule = [];
      
      while (hoursToSchedule > 0 && currentHour < STUDY_END) {
        // Check if current hour is busy
        const isBusy = busyHours.some(busy => 
          currentHour >= busy.start && currentHour < busy.end
        );
        
        if (!isBusy) {
          const startTime = `${currentHour.toString().padStart(2, '0')}:00`;
          const endTime = `${(currentHour + 1).toString().padStart(2, '0')}:00`;
          
          taskSchedule.push({
            startTime,
            endTime,
            hour: currentHour
          });
          
          hoursToSchedule -= 1;
        }
        
        currentHour++;
      }
      
      scheduledTasks.push({
        ...task,
        schedule: taskSchedule
      });
    }
    
    return scheduledTasks;
  }

  // Generate a summary message
  static generateSummary(tasks, totalAssignments) {
    if (tasks.length === 0) {
      return "No study tasks for today. Enjoy your break! 🎉";
    }
    
    const urgentTasks = tasks.filter(t => t.urgency === 'URGENT' || t.urgency === 'OVERDUE!');
    const highTasks = tasks.filter(t => t.urgency === 'High');
    
    let message = `Today you need to study ${tasks.length} subject`;
    if (tasks.length > 1) message += 's';
    message += '.\n\n';
    
    if (urgentTasks.length > 0) {
      message += `⚠️ URGENT: ${urgentTasks.map(t => t.subject).join(', ')} ${urgentTasks.length === 1 ? 'is' : 'are'} due soon!\n\n`;
    }
    
    message += `📚 Total study time: ${tasks.reduce((sum, t) => sum + t.allocatedHours, 0)} hours`;
    
    return message;
  }

  static getDayName(day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }
}

module.exports = StudyEngine;