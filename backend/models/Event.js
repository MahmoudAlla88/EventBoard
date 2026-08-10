const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
    },
    startsAt: {
      type: Date,
      required: [true, 'startsAt is required'],
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price cannot be negative'],
    },
    // An Event has no capacity of its own — it is derived from venue.capacity.
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'venue is required'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'organizer is required'],
    },
    categories: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Supports GET /api/events?q= text search across title + description.
eventSchema.index({ title: 'text', description: 'text' });
// Supports filtering by category quickly.
eventSchema.index({ categories: 1 });

module.exports = mongoose.model('Event', eventSchema);
