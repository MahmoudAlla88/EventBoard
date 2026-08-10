import { apiClient } from './client'

// GET /api/venues
export async function fetchVenues() {
  const { data } = await apiClient.get('/venues')
  return data
}
