const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getTimetable,
  getTimetableByDay,
   getTimetableEntryById, 
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry
} = require('../controllers/timetableController');

const router = express.Router();

// All routes are protected
router.route('/')
  .get(protect, getTimetable)
  .post(protect, createTimetableEntry);

router.get('/day/:day', protect, getTimetableByDay);

router.route('/:id')
  .get(protect, getTimetableEntryById)
  .put(protect, updateTimetableEntry)
  .delete(protect, deleteTimetableEntry);

module.exports = router;