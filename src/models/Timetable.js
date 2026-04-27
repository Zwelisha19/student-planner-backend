const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject name'],
    trim: true,
    minlength: [2, 'Subject must be at least 2 characters'],
    maxlength: [50, 'Subject cannot exceed 50 characters']
  },
  dayOfWeek: {
    type: Number,
    required: [true, 'Please provide day of week'],
    min: [0, 'Day must be between 0 (Sunday) and 6 (Saturday)'],
    max: [6, 'Day must be between 0 (Sunday) and 6 (Saturday)'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Day of week must be an integer'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format (24-hour)'],
    validate: {
      validator: function(value) {
        const [hours, minutes] = value.split(':');
        return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      },
      message: 'Invalid start time'
    }
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format (24-hour)'],
    validate: {
      validator: function(value) {
        const [hours, minutes] = value.split(':');
        return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      },
      message: 'Invalid end time'
    }
  },
  location: {
    type: String,
    default: '',
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  color: {
    type: String,
    default: '#4CAF50',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex code']
  }
}, {
  timestamps: true
});

// Validate that endTime is after startTime
timetableSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    next(new Error('End time must be after start time'));
  }
  next();
});

// Validate that class duration is at least 30 minutes
timetableSchema.pre('save', function(next) {
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationMinutes = endMinutes - startMinutes;
  
  if (durationMinutes < 30) {
    next(new Error('Class duration must be at least 30 minutes'));
  }
  if (durationMinutes > 240) {
    next(new Error('Class duration cannot exceed 4 hours'));
  }
  next();
});

module.exports = mongoose.model('Timetable', timetableSchema);