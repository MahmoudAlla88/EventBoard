import { apiClient } from './client'

// GET /api/users
export async function fetchUsers() {
  const { data } = await apiClient.get('/users')
  return data
}
