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

const router = express.Router();

router.get('/', listEvents);
router.post('/', createEvent);
router.get('/:id', getEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/register', registerForEvent);
router.get('/:id/attendees', listAttendees);

module.exports = router;
