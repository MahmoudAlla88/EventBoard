import { baseApi } from './baseApi'

// GET /api/venues
export function fetchVenues() {
  return baseApi('/venues')
}
