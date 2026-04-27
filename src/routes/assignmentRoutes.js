const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateStatus
} = require('../controllers/assignmentController');

const router = express.Router();

// All routes are protected (require login)
router.route('/')
  .get(protect, getAssignments)
  .post(protect, createAssignment);

router.route('/:id')
  .get(protect, getAssignmentById)
  .put(protect, updateAssignment)
  .delete(protect, deleteAssignment);

router.patch('/:id/status', protect, updateStatus);

module.exports = router;