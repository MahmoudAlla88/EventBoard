const { Client } = require('@elastic/elasticsearch');

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'events';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

// Explicit mapping (the brief asks for one, not a dynamically-inferred
// index): title/description are full-text `text` fields (what gets
// searched + highlighted), venue.city and categories are `keyword` (exact
// match, used as filters, not searched).
const INDEX_MAPPING = {
  properties: {
    title: { type: 'text' },
    description: { type: 'text' },
    venue: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text' },
        city: { type: 'keyword' },
      },
    },
    organizer: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text' },
      },
    },
    categories: { type: 'keyword' },
    price: { type: 'float' },
    startsAt: { type: 'date' },
  },
};

// Called once at server startup. Elasticsearch is a bonus feature here —
// MongoDB stays the source of truth — so a failure to reach ES logs a
// warning instead of crashing the whole API; only the search endpoint
// itself would fail if ES is genuinely down.
async function ensureEventsIndex() {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        mappings: INDEX_MAPPING,
      });
      console.log(`Elasticsearch: created "${INDEX_NAME}" index`);
    }
  } catch (err) {
    console.warn('Elasticsearch not available at startup:', err.message);
  }
}

module.exports = { esClient, INDEX_NAME, ensureEventsIndex };
