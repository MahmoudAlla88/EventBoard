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

## Authentication (JWT)
Added after the app was already fully working with the brief's "no login,
pick a user from a dropdown" model — implementing this genuinely changes
that model (see below), so it's on its own branch until tested rather than
going straight into `main`.
- `POST /api/auth/register` and `/login` issue a JWT (`jsonwebtoken`,
  7-day expiry) signed with `JWT_SECRET`. Passwords are hashed with
  **bcryptjs** (pure JS, no native build step — keeps `npm install`
  reliable for whoever's grading this) via a `pre('save')` hook on the
  `User` model. The password field has `select: false`, so it's never
  returned by a plain `User.find()` — auth code opts back in explicitly
  with `.select('+password')`.
- `middleware/auth.js` (`protect`) verifies the `Authorization: Bearer
  <token>` header and attaches the user document to `req.user`.
- **What changed vs. the no-login model**: `organizer` on `Event` is no
  longer a field the client picks — `POST /api/events` sets it to
  `req.user._id` automatically. `POST /api/events/:id/register` registers
  `req.user._id`, not a `user` id from the request body. Both routes,
  plus `PUT`/`DELETE /api/events/:id`, require `protect`.
- **Bonus role check**: `PUT`/`DELETE /api/events/:id` compare
  `event.organizer` to `req.user._id` and return `403` if they don't
  match — an organizer can only edit/delete their own events. There's no
  separate `role` field on `User`; "organizer" is contextual (whoever
  created *that* event), which matches the data model already in place.
- The old "logged in as" dropdown (reading `GET /api/users`) is replaced
  by real login/register pages. `GET /api/users` itself is untouched and
  still works (still fulfils that line in the brief's endpoint table) —
  it just isn't rendered as a raw list in the UI anymore.
- Seeded users all share one password (`Password123!`, see README) so
  whoever's testing this can log in immediately without registering.

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
Implemented both optional extras: **Elasticsearch** (see "Text search")
and **JWT authentication** (see "Authentication" above) — both requested
after the initial (already-complete) submission, both built on their own
branches and merged only once fully tested, and both are things I could
explain line by line, which was the bar I set for taking either one on.

## What I'd improve with more time
- A waitlist instead of hard-rejecting registrations once a venue is full.
- A few automated tests around the capacity/duplicate registration logic,
  the Elasticsearch sync, and the auth/ownership checks — the trickiest
  parts of the app.
- `docker-compose.yml` to start Elasticsearch (and Mongo, for anyone who'd
  rather not use Atlas) alongside the app with one command.
- A refresh-token flow — right now a JWT is just valid for 7 days flat,
  no revocation or refresh.

## Status
Complete, including both extra credits (Elasticsearch, JWT auth). Backend:
seed script + every endpoint verified against real data (pagination,
Elasticsearch `q` search with typo tolerance + highlighting, city/category
filters, single-event populate, attendees, top-venues aggregation,
400/404/409/401/403 paths, cascade delete, index kept in sync on
create/update/delete, register/login/ownership checks). Frontend: all 3
required pages plus Edit Event, Login/Register, tested live end to end
against the real API with zero console errors. See `README.md` §8 for the
full completed/skipped breakdown.
