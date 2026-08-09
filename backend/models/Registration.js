const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'user is required'],
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'event is required'],
  },
  ticketCount: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'ticketCount must be at least 1'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// A user cannot register twice for the same event.
// Enforced at the MongoDB level, not only in application code.
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
