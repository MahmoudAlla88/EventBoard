# EventHub

A small events app: organizers publish events at venues, and people register to attend.
Built with Node.js + Express, MongoDB (Mongoose) and Vue 3.

> Frontend in progress — Events List page is done, Event Detail and Create Event
> pages are next. Backend is complete. Final run-through and full submission
> checklist will land in this README once everything is done.

## Stack
- Backend: Node.js + Express + Mongoose (MongoDB)
- Frontend: Vue 3 + Vue Router + Tailwind + shadcn-vue + TanStack Vue Query
- Database: MongoDB (Atlas)

## Requirements
- Node.js 18+ (developed on Node 24)
- A MongoDB connection string (Atlas free tier works fine — no local Mongo needed)

## Structure
```
backend/   Express API (MVC: config, models, controllers, routes, middleware)
client/    Vue 3 frontend
```

## Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI (see below)
npm run seed            # populates 5 users, 3 venues, 6 events, 9 registrations
npm run dev              # http://localhost:5000
```

Env vars (`backend/.env`):
| Var | Example |
|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/eventhub` |
| `PORT` | `5000` |

Health check: `GET http://localhost:5000/api/health`

### API endpoints
| Method | Route | Does |
|---|---|---|
| GET | `/api/events` | List events — `q`, `city`, `category`, `page`, `size` |
| GET | `/api/events/:id` | One event, with venue + organizer populated |
| POST | `/api/events` | Create an event |
| PUT | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event and its registrations |
| POST | `/api/events/:id/register` | Register a user for an event |
| GET | `/api/events/:id/attendees` | List users registered for an event |
| GET | `/api/venues` | List venues |
| GET | `/api/users` | List users (for the "logged in as" dropdown) |
| GET | `/api/stats/top-venues` | Top 5 venues by registrations (aggregation) |

## Frontend

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:5000/api
npm run dev              # http://localhost:5173
```

Only the Events List page is wired up so far.

## What's done / what's left
- ✅ Backend: all endpoints, models, validation (400/404/409), capacity +
  duplicate-registration rules, seed script — verified against real data.
- ✅ Frontend: project scaffold, "logged in as" selector, Events List page.
- ⏳ Frontend: Event Detail page, Create Event page.
- ⏭️ Skipped on purpose: JWT auth and Elasticsearch (both optional extras
  per the brief — see `NOTES.md` for reasoning).
