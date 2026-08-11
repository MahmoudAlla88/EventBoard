import { baseApi } from './baseApi'

// POST /api/auth/register
export function registerUser(payload) {
  return baseApi('/auth/register', { method: 'POST', body: payload })
}

// POST /api/auth/login
export function loginUser(payload) {
  return baseApi('/auth/login', { method: 'POST', body: payload })
}

// GET /api/auth/me
export function fetchMe() {
  return baseApi('/auth/me')
}
