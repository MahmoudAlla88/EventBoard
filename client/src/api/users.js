import { baseApi } from './baseApi'

// GET /api/users
export function fetchUsers() {
  return baseApi('/users')
}
