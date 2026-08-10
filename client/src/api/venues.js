import { baseApi } from './baseApi'

// GET /api/venues
export async function fetchVenues() {
  const { data } = await baseApi.get('/venues')
  return data
}
