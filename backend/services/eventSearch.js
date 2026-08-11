const { esClient, INDEX_NAME } = require('../config/elasticsearch');

// Shapes a populated Mongoose Event doc into the flat, denormalized
// document Elasticsearch indexes. Keeps just enough of venue/organizer to
// search and filter on — Mongo (via the id) stays the source of truth for
// everything else.
function toSearchDoc(event) {
  return {
    title: event.title,
    description: event.description,
    venue: event.venue
      ? { id: String(event.venue._id || event.venue), name: event.venue.name, city: event.venue.city }
      : null,
    organizer: event.organizer
      ? { id: String(event.organizer._id || event.organizer), name: event.organizer.name }
      : null,
    categories: event.categories || [],
    price: event.price,
    startsAt: event.startsAt,
  };
}

// Called after create/update. Failures are logged, not thrown — losing
// the search index for one event shouldn't fail the request that just
// successfully wrote to MongoDB (the real source of truth).
async function indexEvent(event) {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: String(event._id),
      document: toSearchDoc(event),
      refresh: 'wait_for', // so a search right after create/update sees it
    });
  } catch (err) {
    console.warn(`Elasticsearch: failed to index event ${event._id}:`, err.message);
  }
}

async function removeEventFromIndex(eventId) {
  try {
    await esClient.delete({ index: INDEX_NAME, id: String(eventId), refresh: 'wait_for' });
  } catch (err) {
    // 404 just means it was never indexed (e.g. ES was down when it was created) — fine to ignore.
    if (err.meta?.statusCode !== 404) {
      console.warn(`Elasticsearch: failed to remove event ${eventId}:`, err.message);
    }
  }
}

// The actual search: typo-tolerant full-text match on title/description
// (title weighted higher), combined with exact-match filters for city and
// category, highlighting the matched words. Returns Mongo ids in
// relevance order plus a highlight snippet per id — the caller re-fetches
// the full documents from MongoDB so the API response shape never diverges
// from the non-search path.
async function searchEvents({ q, city, category, page, size }) {
  const filter = [];
  if (city) filter.push({ term: { 'venue.city': city } });
  if (category) filter.push({ term: { categories: category } });

  const result = await esClient.search({
    index: INDEX_NAME,
    from: (page - 1) * size,
    size,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: q,
              fields: ['title^2', 'description'],
              fuzziness: 'AUTO', // typo tolerance
            },
          },
        ],
        filter,
      },
    },
    highlight: {
      pre_tags: ['<mark>'],
      post_tags: ['</mark>'],
      fields: { title: {}, description: {} },
    },
  });

  const hits = result.hits.hits;
  const total = typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total;

  return {
    total,
    ids: hits.map((h) => h._id),
    highlights: Object.fromEntries(hits.map((h) => [h._id, h.highlight || {}])),
  };
}

// Bulk (re)index every Event currently in MongoDB. Used by the seed script,
// since seeding inserts events directly and bypasses the create/update
// controllers that normally keep the index in sync.
async function reindexAll(Event) {
  const events = await Event.find().populate('venue', 'name city').populate('organizer', 'name');
  if (events.length === 0) return 0;

  const operations = events.flatMap((event) => [
    { index: { _index: INDEX_NAME, _id: String(event._id) } },
    toSearchDoc(event),
  ]);

  await esClient.bulk({ operations, refresh: true });
  return events.length;
}

module.exports = { indexEvent, removeEventFromIndex, searchEvents, reindexAll };
