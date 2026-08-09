import axios from 'axios'

// Single axios instance for the whole app. Base URL comes from the env
// so it's easy to point at a different backend without touching code.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Normalizes axios errors into a plain Error with the backend's message
// (our Express error handler always responds with { error: '...' }),
// so components can just read `err.message`.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)
