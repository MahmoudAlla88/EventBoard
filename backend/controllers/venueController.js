const Venue = require('../models/Venue');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/venues
const listVenues = asyncHandler(async (req, res) => {
  const venues = await Venue.find().sort({ name: 1 });
  res.json(venues);
});

module.exports = { listVenues };
