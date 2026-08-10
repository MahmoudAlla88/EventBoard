import { baseApi } from './baseApi'

// GET /api/events?q=&city=&category=&page=&size=
export async function fetchEvents(params = {}) {
  const { data } = await baseApi.get('/events', { params })
  return data // { data, page, size, total, totalPages }
}

// GET /api/events/:id
export async function fetchEvent(id) {
  const { data } = await baseApi.get(`/events/${id}`)
  return data
}

// POST /api/events
export async function createEvent(payload) {
  const { data } = await baseApi.post('/events', payload)
  return data
}

// PUT /api/events/:id
export async function updateEvent(id, payload) {
  const { data } = await baseApi.put(`/events/${id}`, payload)
  return data
}

// DELETE /api/events/:id
export async function deleteEvent(id) {
  const { data } = await baseApi.delete(`/events/${id}`)
  return data
}

// POST /api/events/:id/register
export async function registerForEvent(id, payload) {
  const { data } = await baseApi.post(`/events/${id}/register`, payload)
  return data
}

// GET /api/events/:id/attendees
export async function fetchAttendees(id) {
  const { data } = await baseApi.get(`/events/${id}/attendees`)
  return data
}
