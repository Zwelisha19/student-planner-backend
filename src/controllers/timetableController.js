const Timetable = require('../models/Timetable');

// @desc    Get all timetable entries for logged in user
// @route   GET /api/timetable
// @access  Private
const getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.find({ user: req.user.id }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({
      success: true,
      count: timetable.length,
      data: timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single timetable entry
// @route   GET /api/timetable/:id
// @access  Private
const getTimetableEntryById = async (req, res) => {
  try {
    const timetableEntry = await Timetable.findById(req.params.id);
    
    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }
    
    // Check if user owns this entry
    if (timetableEntry.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      data: timetableEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get timetable for a specific day
// @route   GET /api/timetable/day/:day
// @access  Private
const getTimetableByDay = async (req, res) => {
  try {
    const day = parseInt(req.params.day);
    const timetable = await Timetable.find({ 
      user: req.user.id,
      dayOfWeek: day 
    }).sort({ startTime: 1 });
    
    res.json({
      success: true,
      count: timetable.length,
      data: timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a timetable entry
// @route   POST /api/timetable
// @access  Private
const createTimetableEntry = async (req, res) => {
  try {
    const { subject, dayOfWeek, startTime, endTime, location, color } = req.body;
    
    const timetableEntry = await Timetable.create({
      user: req.user.id,
      subject,
      dayOfWeek,
      startTime,
      endTime,
      location,
      color
    });
    
    res.status(201).json({
      success: true,
      data: timetableEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a timetable entry
// @route   PUT /api/timetable/:id
// @access  Private
const updateTimetableEntry = async (req, res) => {
  try {
    let timetableEntry = await Timetable.findById(req.params.id);
    
    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }
    
    // Check if user owns this entry
    if (timetableEntry.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    timetableEntry = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: timetableEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a timetable entry
// @route   DELETE /api/timetable/:id
// @access  Private
const deleteTimetableEntry = async (req, res) => {
  try {
    const timetableEntry = await Timetable.findById(req.params.id);
    
    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }
    
    // Check if user owns this entry
    if (timetableEntry.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    await timetableEntry.deleteOne();
    
    res.json({
      success: true,
      message: 'Timetable entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getTimetable,
  getTimetableByDay,
  createTimetableEntry,
  getTimetableEntryById,
  updateTimetableEntry,
  deleteTimetableEntry
};