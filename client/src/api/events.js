import { baseApi } from './baseApi'

// GET /api/events?q=&city=&category=&page=&size=
export function fetchEvents(params = {}) {
  return baseApi('/events', { params }) // { data, page, size, total, totalPages }
}

// GET /api/events/:id
export function fetchEvent(id) {
  return baseApi(`/events/${id}`)
}

// POST /api/events
export function createEvent(payload) {
  return baseApi('/events', { method: 'POST', body: payload })
}

// PUT /api/events/:id
export function updateEvent(id, payload) {
  return baseApi(`/events/${id}`, { method: 'PUT', body: payload })
}

// DELETE /api/events/:id
export function deleteEvent(id) {
  return baseApi(`/events/${id}`, { method: 'DELETE' })
}

// POST /api/events/:id/register
export function registerForEvent(id, payload) {
  return baseApi(`/events/${id}/register`, { method: 'POST', body: payload })
}

// GET /api/events/:id/attendees
export function fetchAttendees(id) {
  return baseApi(`/events/${id}/attendees`)
}
