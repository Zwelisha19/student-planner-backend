const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  studyPreferences: {
    availableHoursPerDay: {
      type: Number,
      default: 4,
      min: [1, 'Minimum 1 hour per day'],
      max: [16, 'Maximum 16 hours per day']
    },
    preferredStudyTimes: [{
      startTime: { 
        type: String, 
        default: '09:00',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
      },
      endTime: { 
        type: String, 
        default: '17:00',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
      }
    }],
    weeklyOffDays: {
      type: [Number],
      default: [0, 6],
      validate: {
        validator: function(days) {
          return days.every(day => day >= 0 && day <= 6);
        },
        message: 'Days must be between 0 (Sunday) and 6 (Saturday)'
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);