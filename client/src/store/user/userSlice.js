import { defineStore } from 'pinia'
import { loginUser, registerUser, fetchMe } from '@/api/auth'

const TOKEN_STORAGE_KEY = 'eventhub.token' // must match src/api/baseApi.js

// The auth slice: who's logged in, and the actions that change it. Same
// state/actions/getters shape as a Redux slice — see NOTES.md for why
// Pinia is the Vue-native equivalent used here instead of Redux.
export const useUserSlice = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(TOKEN_STORAGE_KEY) || null,
    user: null, // populated by restoreSession() / login() / register()
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    currentUserId: (state) => state.user?._id ?? null,
  },
  actions: {
    setSession(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    },
    async login(email, password) {
      const { token, user } = await loginUser({ email, password })
      this.setSession(token, user)
    },
    async register(name, email, password) {
      const { token, user } = await registerUser({ name, email, password })
      this.setSession(token, user)
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    },
    // Called once on app start: if a token is already in localStorage,
    // fetch the matching user so the UI knows who's logged in without
    // asking them to log in again on every page refresh.
    async restoreSession() {
      if (!this.token) return
      try {
        this.user = await fetchMe()
      } catch {
        // Token expired/invalid — clear it rather than staying half-logged-in.
        this.logout()
      }
    },
  },
})
