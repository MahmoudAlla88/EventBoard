require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { ensureEventsIndex } = require('./config/elasticsearch');
const { reindexAll } = require('./services/eventSearch');

const User = require('./models/User');
const Venue = require('./models/Venue');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Venue.deleteMany({}),
    Event.deleteMany({}),
    Registration.deleteMany({}),
  ]);

  // Every seeded user shares one known password so reviewers can log in
  // immediately without signing up — documented in README.md.
  const SEED_PASSWORD = 'Password123!';

  console.log('Inserting users...');
  // User.create() (not insertMany) so the password-hashing pre('save')
  // hook on the User model actually runs for each document.
  const users = await User.create([
    { name: 'Alice Johnson', email: 'alice@example.com', password: SEED_PASSWORD },
    { name: 'Bilal Ahmad', email: 'bilal@example.com', password: SEED_PASSWORD },
    { name: 'Carla Gomez', email: 'carla@example.com', password: SEED_PASSWORD },
    { name: 'Dana Kim', email: 'dana@example.com', password: SEED_PASSWORD },
    { name: 'Omar Nasser', email: 'omar@example.com', password: SEED_PASSWORD },
  ]);
  const [alice, bilal, carla, dana, omar] = users;

  console.log('Inserting venues...');
  const venues = await Venue.insertMany([
    { name: 'Amman Convention Center', city: 'Amman', address: 'King Hussein St, Amman', capacity: 200 },
    { name: 'Zaha Hub', city: 'Amman', address: 'Al-Rainbow St, Amman', capacity: 50 },
    { name: 'Irbid Community Hall', city: 'Irbid', address: 'University St, Irbid', capacity: 5 },
  ]);
  const [ammanCC, zahaHub, irbidHall] = venues;

  const inDays = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  console.log('Inserting events...');
  const events = await Event.insertMany([
    {
      title: 'Tech Meetup: JS Frameworks',
      description: 'A community meetup comparing modern JavaScript frameworks, with lightning talks and networking.',
      startsAt: inDays(7),
      price: 0,
      venue: ammanCC._id,
      organizer: alice._id,
      categories: ['Tech', 'Workshop'],
    },
    {
      title: 'Amman Jazz Night',
      description: 'An evening of live jazz performances from local and regional artists.',
      startsAt: inDays(10),
      price: 15,
      venue: zahaHub._id,
      organizer: bilal._id,
      categories: ['Music'],
    },
    {
      title: 'Startup Pitch Day',
      description: 'Early-stage founders pitch their startups to a panel of investors and mentors.',
      startsAt: inDays(14),
      price: 10,
      venue: ammanCC._id,
      organizer: carla._id,
      categories: ['Business', 'Tech'],
    },
    {
      title: 'Local Food Festival',
      description: 'Sample dishes from the best local restaurants and food trucks in the city.',
      startsAt: inDays(21),
      price: 5,
      venue: zahaHub._id,
      organizer: dana._id,
      categories: ['Food'],
    },
    {
      title: 'Community Art Fair',
      description: 'A small, intimate showcase of work from local painters, sculptors and photographers.',
      startsAt: inDays(5),
      price: 0,
      venue: irbidHall._id,
      organizer: omar._id,
      categories: ['Art'],
    },
    {
      title: 'Football Friendly Tournament',
      description: 'A friendly 5-a-side football tournament open to all skill levels.',
      startsAt: inDays(30),
      price: 8,
      venue: ammanCC._id,
      organizer: alice._id,
      categories: ['Sports'],
    },
  ]);
  const [techMeetup, jazzNight, pitchDay, foodFestival, artFair] = events;

  console.log('Inserting registrations...');
  await Registration.insertMany([
    { user: bilal._id, event: techMeetup._id, ticketCount: 1 },
    { user: carla._id, event: techMeetup._id, ticketCount: 2 },
    { user: alice._id, event: jazzNight._id, ticketCount: 1 },
    { user: dana._id, event: jazzNight._id, ticketCount: 1 },
    { user: omar._id, event: pitchDay._id, ticketCount: 1 },
    // Art Fair is at Irbid Community Hall (capacity 5). These 4 tickets
    // leave exactly 1 seat open — handy for demoing both a successful
    // registration and then a 409 capacity-full response right after.
    { user: alice._id, event: artFair._id, ticketCount: 1 },
    { user: bilal._id, event: artFair._id, ticketCount: 1 },
    { user: carla._id, event: artFair._id, ticketCount: 1 },
    { user: dana._id, event: artFair._id, ticketCount: 1 },
  ]);

  console.log('Indexing events in Elasticsearch...');
  try {
    await ensureEventsIndex();
    const indexed = await reindexAll(Event);
    console.log(`  ${indexed} events indexed.`);
  } catch (err) {
    console.warn('  Skipped — Elasticsearch is not reachable:', err.message);
  }

  console.log('Seed complete:');
  console.log(`  ${users.length} users, ${venues.length} venues, ${events.length} events`);
  console.log('  Art Fair (Irbid Community Hall) is at 4/5 capacity — good for testing register + capacity limits.');
  console.log(`  Log in as any seeded user with password: ${SEED_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
