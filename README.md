# EventHub

A small events app: organizers publish events at venues, and people register to attend.
Built with Node.js + Express, MongoDB (Mongoose) and Vue 3.

> All 3 required pages are done and backend is complete. Final polish pass
> (README completeness check, NOTES.md wrap-up) still to come before submission.

## Stack
- Backend: Node.js + Express + Mongoose (MongoDB)
- Frontend: Vue 3 + Vue Router + Pinia + TanStack Vue Query + Tailwind + shadcn-vue
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

All 3 required pages: Events List (search/filters/pagination + a "top
venues" widget), Event Detail (register + attendees + edit/delete), Create
Event (form with validation). Edit Event reuses the same form component.

## What's done / what's left
- Backend: all 10 endpoints, models, validation (400/404/409), capacity +
  duplicate-registration rules, seed script — verified against real data.
- Frontend: all 3 required pages, plus Edit Event so every backend
  endpoint (including update/delete and the top-venues aggregation) is
  actually exercised from the UI, not just curl-tested. "Logged in as"
  selector (Pinia), register/attendees flow — tested live end to end.
- Skipped on purpose: JWT auth and Elasticsearch (both optional extras
  per the brief — see `NOTES.md` for reasoning).
- Left: final polish pass (docker-compose / tests if time allows).
