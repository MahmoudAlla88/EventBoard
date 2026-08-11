const mongoose = require('mongoose');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const User = require('../models/User');
const Registration = require('../models/Registration');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { indexEvent, removeEventFromIndex, searchEvents } = require('../services/eventSearch');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/events?q=&city=&category=&page=&size=
const listEvents = asyncHandler(async (req, res) => {
  const { q, city, category } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 10, 1), 100);

  // Free-text search (q) is served by Elasticsearch, not MongoDB — see
  // NOTES.md. City/category-only browsing (no q) has no reason to involve
  // ES, so it keeps using a plain Mongo find.
  if (q) {
    const { total, ids, highlights } = await searchEvents({ q, city, category, page, size });

    // Elasticsearch decided *which* events match and in what order;
    // MongoDB is still the source of truth for the actual event data, so
    // re-fetch by id and put the results back in ES's relevance order.
    const events = await Event.find({ _id: { $in: ids } })
      .populate('venue', 'name city address capacity')
      .populate('organizer', 'name email');
    const byId = new Map(events.map((e) => [String(e._id), e]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((event) => ({ ...event.toObject(), _highlight: highlights[String(event._id)] }));

    return res.json({
      data: ordered,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size) || 1,
    });
  }

  const filter = {};

  if (category) {
    filter.categories = category;
  }

  // city lives on Venue, not Event, so resolve matching venues first.
  if (city) {
    const venues = await Venue.find({ city: new RegExp(`^${city}$`, 'i') }).select('_id');
    filter.venue = { $in: venues.map((v) => v._id) };
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('venue', 'name city address capacity')
      .populate('organizer', 'name email')
      .sort({ startsAt: 1 })
      .skip((page - 1) * size)
      .limit(size),
    Event.countDocuments(filter),
  ]);

  res.json({
    data: events,
    page,
    size,
    total,
    totalPages: Math.ceil(total / size) || 1,
  });
});

// GET /api/events/:id
const getEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new ApiError(400, `Invalid event id: ${id}`);

  const event = await Event.findById(id)
    .populate('venue', 'name city address capacity')
    .populate('organizer', 'name email');

  if (!event) throw new ApiError(404, 'Event not found');

  res.json(event);
});

// POST /api/events
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, startsAt, price, venue, organizer, categories } = req.body;

  if (!title || !description || !startsAt || price === undefined || !venue || !organizer) {
    throw new ApiError(400, 'title, description, startsAt, price, venue and organizer are required');
  }
  if (!isValidId(venue)) throw new ApiError(400, `Invalid venue id: ${venue}`);
  if (!isValidId(organizer)) throw new ApiError(400, `Invalid organizer id: ${organizer}`);

  const [venueDoc, organizerDoc] = await Promise.all([
    Venue.findById(venue),
    User.findById(organizer),
  ]);
  if (!venueDoc) throw new ApiError(400, 'venue does not exist');
  if (!organizerDoc) throw new ApiError(400, 'organizer does not exist');

  const event = await Event.create({
    title,
    description,
    startsAt,
    price,
    venue,
    organizer,
    categories: Array.isArray(categories) ? categories : [],
  });

  const populated = await event.populate([
    { path: 'venue', select: 'name city address capacity' },
    { path: 'organizer', select: 'name email' },
  ]);

  await indexEvent(populated);

  res.status(201).json(populated);
});

// PUT /api/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new ApiError(400, `Invalid event id: ${id}`);

  const { title, description, startsAt, price, venue, organizer, categories } = req.body;

  if (venue) {
    if (!isValidId(venue)) throw new ApiError(400, `Invalid venue id: ${venue}`);
    const venueDoc = await Venue.findById(venue);
    if (!venueDoc) throw new ApiError(400, 'venue does not exist');
  }
  if (organizer) {
    if (!isValidId(organizer)) throw new ApiError(400, `Invalid organizer id: ${organizer}`);
    const organizerDoc = await User.findById(organizer);
    if (!organizerDoc) throw new ApiError(400, 'organizer does not exist');
  }

  const update = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (startsAt !== undefined) update.startsAt = startsAt;
  if (price !== undefined) update.price = price;
  if (venue !== undefined) update.venue = venue;
  if (organizer !== undefined) update.organizer = organizer;
  if (categories !== undefined) update.categories = categories;

  const event = await Event.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
    .populate('venue', 'name city address capacity')
    .populate('organizer', 'name email');

  if (!event) throw new ApiError(404, 'Event not found');

  await indexEvent(event);

  res.json(event);
});

// DELETE /api/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new ApiError(400, `Invalid event id: ${id}`);

  const event = await Event.findByIdAndDelete(id);
  if (!event) throw new ApiError(404, 'Event not found');

  // Deleting an event must not leave its registrations behind.
  await Registration.deleteMany({ event: id });
  await removeEventFromIndex(id);

  res.status(200).json({ message: 'Event and its registrations were deleted' });
});

// POST /api/events/:id/register
const registerForEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user, ticketCount = 1 } = req.body;

  if (!isValidId(id)) throw new ApiError(400, `Invalid event id: ${id}`);
  if (!user || !isValidId(user)) throw new ApiError(400, 'A valid user id is required');
  if (!Number.isInteger(ticketCount) || ticketCount < 1) {
    throw new ApiError(400, 'ticketCount must be a positive integer');
  }

  const event = await Event.findById(id).populate('venue', 'capacity');
  if (!event) throw new ApiError(404, 'Event not found');

  const userDoc = await User.findById(user);
  if (!userDoc) throw new ApiError(404, 'User not found');

  // Check duplicate registration BEFORE capacity: if this user already has
  // a seat, "event is full" would be a misleading answer to a person who's
  // already registered. The unique index still guards this at the DB level
  // for concurrent requests (race condition), this check just gives a
  // clearer, correctly-prioritized error in the common case.
  const existing = await Registration.findOne({ user, event: id });
  if (existing) {
    throw new ApiError(409, 'This user is already registered for this event');
  }

  const currentTotal = await Registration.aggregate([
    { $match: { event: event._id } },
    { $group: { _id: null, total: { $sum: '$ticketCount' } } },
  ]);
  const alreadyRegistered = currentTotal[0]?.total || 0;

  if (alreadyRegistered + ticketCount > event.venue.capacity) {
    throw new ApiError(409, 'Event has reached the capacity of its venue');
  }

  const registration = await Registration.create({ user, event: id, ticketCount });

  res.status(201).json(registration);
});

// GET /api/events/:id/attendees
const listAttendees = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new ApiError(400, `Invalid event id: ${id}`);

  const event = await Event.findById(id);
  if (!event) throw new ApiError(404, 'Event not found');

  const registrations = await Registration.find({ event: id })
    .populate('user', 'name email')
    .sort({ createdAt: 1 });

  res.json(registrations);
});

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  listAttendees,
};
