import { baseApi } from './baseApi'

// GET /api/stats/top-venues — top 5 venues by number of registrations
// (backed by a MongoDB aggregation pipeline, not a simple find).
export function fetchTopVenues() {
  return baseApi('/stats/top-venues')
}
