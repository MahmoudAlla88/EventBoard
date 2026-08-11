# EventHub

## 1. What it does
A small events app. Organizers publish events at venues; other users
browse/search/filter those events and register to attend. There's no login —
a "logged in as" dropdown (top right) lets you pick which seeded user you're
acting as. Built with Node.js + Express, MongoDB (Mongoose), Vue 3, and
Elasticsearch for search.

## 2. Requirements & versions
- **Node.js 18+** (developed and tested on Node 24)
- **MongoDB** — any reachable MongoDB instance works; see below for two ways
  to get one running in under a minute
- **Elasticsearch** (optional — only needed for the `q` search parameter;
  everything else works without it) — see below to run it via Docker

## 3. How to start MongoDB
Pick one:

**Option A — MongoDB Atlas (what this was built and tested against, no local install):**
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) (M0 tier).
2. Database Access → create a DB user + password.
3. Network Access → add `0.0.0.0/0` (Allow Access from Anywhere) — simplest for local dev.
4. Connect → Drivers → copy the `mongodb+srv://...` connection string.

**Option B — Local MongoDB via Docker (fastest if you don't want an Atlas account):**
```bash
docker run -d --name eventhub-mongo -p 27017:27017 mongo:7
```
Then use `MONGODB_URI=mongodb://localhost:27017/eventhub`.

## Elasticsearch (extra credit — implemented, optional to run)
Powers `GET /api/events?q=...` (typo-tolerant search with highlighting).
Everything else in the app works fine without it — if it's not running,
the API logs a warning and only the `q` search parameter is affected.

```bash
docker run -d --name eventhub-es -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.15.0
```
Give it ~30-60s to finish booting (`curl http://localhost:9200` should
return a JSON cluster info response once ready). The backend creates the
index automatically on startup, and `npm run seed` (backend) indexes all
seeded events — see NOTES.md for how the index is kept in sync.

## 4. Environment variables
Both `backend/.env.example` and `client/.env.example` are committed — copy
each to `.env` in its own folder and fill in as needed.

**`backend/.env`**
| Var | Example |
|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/eventhub` (or the local Docker URI above) |
| `PORT` | `5000` |
| `ELASTICSEARCH_URL` | `http://localhost:9200` (optional, defaults to this) |
| `ELASTICSEARCH_INDEX` | `events` (optional, defaults to this) |

**`client/.env`**
| Var | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` (default if unset) |

## 5. Install & run

**Backend** — runs on `http://localhost:5000`
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI
npm run dev
```
Health check: `GET http://localhost:5000/api/health` → `{"status":"ok"}`

**Frontend** — runs on `http://localhost:5173`, in a second terminal
```bash
cd client
npm install
cp .env.example .env   # defaults are fine if the backend is on :5000
npm run dev
```

## 6. Seed script
Populates the database with sample data so there's something to look at
immediately (5 users, 3 venues, 6 events, 9 registrations — one venue seeded
at 4/5 capacity to make the capacity limit easy to test). Also indexes all
seeded events into Elasticsearch, if it's running.
```bash
cd backend
npm run seed
```
Safe to re-run any time — it wipes and re-inserts all four collections.

## 7. API endpoints
| Method | Route | Does |
|---|---|---|
| GET | `/api/events` | List events — `q` (Elasticsearch search, typo-tolerant + highlighted), `city`, `category`, `page`, `size` |
| GET | `/api/events/:id` | One event, with venue + organizer populated |
| POST | `/api/events` | Create an event |
| PUT | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event and its registrations |
| POST | `/api/events/:id/register` | Register a user for an event |
| GET | `/api/events/:id/attendees` | List users registered for an event |
| GET | `/api/venues` | List venues |
| GET | `/api/users` | List users (for the "logged in as" dropdown) |
| GET | `/api/stats/top-venues` | Top 5 venues by registrations (aggregation pipeline) |

## 8. What's completed / what's skipped / known issues

**Completed — everything in the required brief:**
- All 4 collections with the relationships as specified (see `NOTES.md` for why).
- All 10 API endpoints above, validated (400/404/409), including the
  capacity limit and duplicate-registration rules, compound unique index
  enforced at the MongoDB level, cascade delete of registrations.
- All 3 required frontend pages — Events List (search + city/category
  filters + pagination), Event Detail (venue/organizer/categories/attendees
  + register), Create Event (validated form with venue/organizer dropdowns)
  — plus "logged in as" user selector.

**Completed extra credit:**
- **Elasticsearch** — explicit index mapping, kept in sync on
  create/update/delete, typo tolerance + match highlighting. See NOTES.md.
- Not required but built so every backend endpoint is actually exercised
  from the UI (not just curl-tested): Edit Event page + Delete button, and
  a "Top venues" widget using the aggregation endpoint.

**Skipped on purpose:**
- JWT authentication — optional per the brief; see `NOTES.md` for reasoning.

**Known issues:** none currently known. If something breaks in your
environment, it's most likely MongoDB connectivity (Atlas Network Access /
IP whitelist) — see section 3 above. Elasticsearch being down does not
break anything except the `q` search parameter.

## Stack
- Backend: Node.js + Express + Mongoose (MongoDB) + Elasticsearch (search)
- Frontend: Vue 3 + Vue Router + Pinia + TanStack Vue Query + Tailwind + shadcn-vue

## Structure
```
backend/   Express API (MVC: config, models, controllers, routes, middleware)
client/    Vue 3 frontend
```
