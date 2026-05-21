const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https'); // ADD THIS - For keep-alive

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');
const timetableRoutes = require('./src/routes/timetableRoutes'); 
const studyPlanRoutes = require('./src/routes/studyPlanRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const startReminderJobs = require('./src/jobs/reminderJob');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);  
app.use('/api/timetable', timetableRoutes); 
app.use('/api/studyplan', studyPlanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ 
    message: 'Student Planner API is running! 🚀',
    status: 'success',
    endpoints: {
      auth: '/api/auth',
      assignments: '/api/assignments',
      timetable: '/api/timetable'
    }
  });
});

// KEEP ALIVE FUNCTION - Prevents Render from sleeping
function keepAlive() {
  const backendUrl = process.env.BACKEND_URL || 'https://student-planner-backend-n6nx.onrender.com';
  
  setInterval(() => {
    https.get(`${backendUrl}/api`, (res) => {
      console.log(`⏰ Keep-alive ping sent - Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log('⚠️ Keep-alive ping failed:', err.message);
    });
  }, 4 * 60 * 1000); // Every 4 minutes
  
  console.log('✅ Keep-alive service started - Server will stay awake!');
}

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start reminder jobs
    startReminderJobs();
    
    // Start keep-alive service (prevents Render from sleeping)
    keepAlive();

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Test API: http://localhost:${PORT}/`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`📋 Assignments API: http://localhost:${PORT}/api/assignments`);
      console.log(`📅 Timetable API: http://localhost:${PORT}/api/timetable`);
      console.log(`🎯 Study Plan API: http://localhost:${PORT}/api/studyplan`);
      console.log(`🔔 Notifications API: http://localhost:${PORT}/api/notifications`);
      console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
