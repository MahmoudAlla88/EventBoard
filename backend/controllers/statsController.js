const Registration = require('../models/Registration');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/stats/top-venues
// Top 5 venues by number of registrations. Built as an aggregation pipeline
// (not a simple find) as required by the task brief:
//   Registration -> join Event (to read its venue) -> group by venue,
//   count registrations -> sort desc -> top 5 -> join Venue for display.
const topVenues = asyncHandler(async (req, res) => {
  const results = await Registration.aggregate([
    {
      $lookup: {
        from: 'events',
        localField: 'event',
        foreignField: '_id',
        as: 'event',
      },
    },
    { $unwind: '$event' },
    {
      $group: {
        _id: '$event.venue',
        registrationCount: { $sum: '$ticketCount' },
      },
    },
    { $sort: { registrationCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'venues',
        localField: '_id',
        foreignField: '_id',
        as: 'venue',
      },
    },
    { $unwind: '$venue' },
    {
      $project: {
        _id: 0,
        venue: 1,
        registrationCount: 1,
      },
    },
  ]);

  res.json(results);
});

module.exports = { topVenues };
