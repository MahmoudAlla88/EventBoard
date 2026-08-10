import { baseApi } from './baseApi'

// GET /api/users
export async function fetchUsers() {
  const { data } = await baseApi.get('/users')
  return data
}
