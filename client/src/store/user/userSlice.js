import { defineStore } from 'pinia'

const STORAGE_KEY = 'eventhub.currentUserId'

// This is our Redux-equivalent "slice" for the current user. Vue's official
// state-management library is Pinia (the Vuex successor) rather than Redux —
// Redux/RTK are React-specific — but the shape is the same idea: a named
// store with state + actions + getters, one per domain.
export const useUserSlice = defineStore('user', {
  state: () => ({
    currentUserId: localStorage.getItem(STORAGE_KEY) || null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.currentUserId),
  },
  actions: {
    setCurrentUser(userId) {
      this.currentUserId = userId
      if (userId) {
        localStorage.setItem(STORAGE_KEY, userId)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    clearCurrentUser() {
      this.setCurrentUser(null)
    },
  },
})
