const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Please provide assignment title'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject name'],
    trim: true,
    minlength: [2, 'Subject must be at least 2 characters'],
    maxlength: [50, 'Subject cannot exceed 50 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide due date'],
    validate: {
      validator: function(value) {
        // Due date cannot be in the past (allow same day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Due date cannot be in the past'
    }
  },
  estimatedHours: {
    type: Number,
    required: [true, 'Please provide estimated hours'],
    min: [0.5, 'Minimum study time is 30 minutes (0.5 hours)'],
    max: [24, 'Cannot exceed 24 hours per assignment']
  },
  status: {
    type: String,
    enum: {
      values: ['Not Started', 'In Progress', 'Done'],
      message: 'Status must be: Not Started, In Progress, or Done'
    },
    default: 'Not Started'
  },
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High'],
      message: 'Priority must be: Low, Medium, or High'
    },
    default: 'Medium'
  },
  completedAt: {
    type: Date,
    validate: {
      validator: function(value) {
        // If status is Done, completedAt must exist
        if (this.status === 'Done' && !value) {
          return false;
        }
        return true;
      },
      message: 'Completed date is required when status is Done'
    }
  }
}, {
  timestamps: true
});

// Auto-calculate priority before saving
assignmentSchema.pre('save', function(next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(this.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) {
    this.priority = 'High';
  } else if (daysUntilDue <= 2) {
    this.priority = 'High';
  } else if (daysUntilDue <= 7) {
    this.priority = 'Medium';
  } else {
    this.priority = 'Low';
  }
  
  next();
});

// Validate that if status is Done, completedAt is set
assignmentSchema.pre('save', function(next) {
  if (this.status === 'Done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  if (this.status !== 'Done') {
    this.completedAt = null;
  }
  next();
});

module.exports = mongoose.model('Assignment', assignmentSchema);