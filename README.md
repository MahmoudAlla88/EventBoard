# EventHub

A small events app: organizers publish events at venues, and people register to attend.
Built with Node.js + Express, MongoDB (Mongoose) and Vue 3.

> Work in progress. This README will be filled in with full run instructions,
> environment variables, seed script usage and the endpoint list once the
> backend and frontend are complete.

## Stack
- Backend: Node.js + Express + Mongoose (MongoDB)
- Frontend: Vue 3 + Vue Router
- Database: MongoDB (Atlas)

## Structure
```
backend/   Express API (MVC: config, models, controllers, routes, middleware)
client/    Vue 3 frontend
```

## Backend — quick start
```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI
npm run dev
```
API runs on `http://localhost:5000` (health check: `GET /api/health`).

## Frontend
See `client/README` (coming soon) once the Vue app is scaffolded.
