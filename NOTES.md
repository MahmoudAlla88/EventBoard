# Implementation notes

## Relationships
- **Venue → Events** and **Organizer (User) → Events**: stored as `ObjectId` references
  on the `Event` document (`event.venue`, `event.organizer`), as required by the brief.
- **Users ↔ Events (many-to-many)**: modeled with a separate `Registration` collection
  rather than an array on `Event`, so a registration can carry its own data
  (`ticketCount`, `createdAt`) and so an event with many registrations doesn't grow
  an unbounded array on the Event document.
- **Registration** has a compound **unique index** on `{ user: 1, event: 1 }`, enforced
  by MongoDB itself (not just app code), so the same user can't register twice for the
  same event — a duplicate insert throws a Mongo `E11000` error, which the central
  error handler turns into a `409`.
- **Event capacity**: an Event has no `capacity` field of its own — its limit is read
  from `event.venue.capacity` at registration time.
- Deleting an Event cascades: its Registrations are deleted in the same request
  (`DELETE /api/events/:id`).

## Text search
Implemented with **Elasticsearch** (the brief's extra-credit option), not
MongoDB — I originally shipped a MongoDB `$text` index and switched it out
once I decided to build the ES extra credit properly rather than leave two
half-finished search implementations.
- `backend/config/elasticsearch.js` creates an `events` index with an
  **explicit mapping** at startup (`title`/`description` as `text`,
  `venue.city`/`categories` as `keyword` for exact-match filtering,
  `price`/`startsAt` typed) — never relies on ES's dynamic mapping.
- `backend/services/eventSearch.js` keeps the index in sync: `indexEvent()`
  runs after every create/update, `removeEventFromIndex()` after every
  delete. **MongoDB stays the source of truth** — the ES doc only carries
  what's needed to search/filter/rank; the actual API response is always
  re-fetched from Mongo by the ids ES returned, in ES's relevance order.
- `GET /api/events?q=` only hits Elasticsearch when `q` is present; plain
  browsing/filtering (no `q`) still goes straight to Mongo, since ES adds
  nothing there.
- **Bonus implemented**: typo tolerance (`fuzziness: 'AUTO'` on the
  `multi_match` query — e.g. `q=meetng` matches "Meetup") and highlighting
  (`<mark>` tags around matched words, returned as `_highlight` on each
  result).
- If Elasticsearch is unreachable, indexing/search calls log a warning and
  fail gracefully instead of crashing the API (`config/elasticsearch.js`,
  `services/eventSearch.js`) — it's explicitly a bonus layer on top of Mongo.
- Run locally via Docker (see README §3): `docker run -d --name eventhub-es
  -p 9200:9200 -e "discovery.type=single-node" -e
  "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.15.0`

## Registration: duplicate vs. capacity ordering
`POST /api/events/:id/register` checks for an existing registration
**before** checking venue capacity. Found this the hard way while testing:
with capacity check first, a user who was already registered but retried
the request got told "event is full" instead of "you're already
registered" — technically true but a confusing answer to someone who
already has a seat. Duplicate is checked first now; the unique index on
`Registration{user, event}` still backstops both paths against race
conditions.

## State management: Pinia, not Redux
Redux and RTK Query are React-specific tooling, so they don't apply to a
Vue 3 app. Used the direct Vue equivalents instead, keeping the same
mental model that was asked for:
- **Pinia** (`client/src/store/user/userSlice.js`) for the current
  "logged in as" user — a named store with `state`/`actions`/`getters`,
  the same shape as a Redux slice (`createSlice`). Pinia is Vue core
  team's official replacement for Vuex and fills the exact role Redux
  fills in React.
- **`client/src/api/baseApi.js`** + one file per resource (`events.js`,
  `venues.js`, `users.js`) — the same role RTK Query's `fetchBaseQuery`
  and per-feature `injectEndpoints` play, adapted to `@tanstack/vue-query`
  (Vue's TanStack Query, the direct RTK Query analogue: caching,
  loading/error state, refetch, all framework-agnostic under the hood).

## Extra credit
Implemented **Elasticsearch** (see "Text search" above) — I could explain
every line of it, which was the bar for taking on an optional extra.
Skipped **JWT auth** on purpose, still: it's a much bigger surface
(hashing, tokens, protected routes, roles) for a no-login app the brief
explicitly says to keep login-free, and I'd rather spend the extra time
made available by a clean Elasticsearch implementation than bolt on auth
that isn't asked for.

## What I'd improve with more time
- A waitlist instead of hard-rejecting registrations once a venue is full.
- A few automated tests around the capacity/duplicate registration logic
  and the Elasticsearch sync, since those are the trickiest parts of the app.
- `docker-compose.yml` to start Elasticsearch (and Mongo, for anyone who'd
  rather not use Atlas) alongside the app with one command.

## Status
Complete, including the Elasticsearch extra credit. Backend: seed script +
every endpoint verified against real data (pagination, Elasticsearch `q`
search with typo tolerance + highlighting, city/category filters,
single-event populate, attendees, top-venues aggregation, 400/404/409
paths, cascade delete, index kept in sync on create/update/delete).
Frontend: all 3 required pages plus Edit Event, tested live end to end
against the real API with zero console errors. See `README.md` §8 for the
full completed/skipped breakdown.
