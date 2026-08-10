const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'city is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'address is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'capacity is required'],
      min: [1, 'capacity must be at least 1'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', venueSchema);
