const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_STORAGE_KEY = 'eventhub.token'

// The shared fetch wrapper every feature api file builds on — the same role
// `fetchBaseQuery` plays for RTK Query's `createApi` (RTK Query itself
// doesn't use axios either, it's a thin wrapper around native fetch).
// One base URL, one place that builds query strings, attaches the JWT (if
// logged in) and normalizes errors from our Express error handler's
// `{ error: '...' }` response shape.
export async function baseApi(path, { method = 'GET', body, params } = {}) {
  const url = new URL(API_URL + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`)
  }

  return data
}
