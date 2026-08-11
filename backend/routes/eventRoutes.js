const express = require('express');
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  listAttendees,
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', listEvents);
router.post('/', protect, createEvent);
router.get('/:id', getEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/register', protect, registerForEvent);
router.get('/:id/attendees', listAttendees);

module.exports = router;
