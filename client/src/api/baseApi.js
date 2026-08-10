import axios from 'axios'

// The shared base client every feature API file builds on — the same role
// `fetchBaseQuery` plays for RTK Query's `createApi`. One axios instance,
// one base URL (from env), one place that normalizes errors.
export const baseApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Normalizes axios errors into a plain Error with the backend's message
// (our Express error handler always responds with { error: '...' }),
// so components can just read `err.message`.
baseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)
