import { ref, watch } from 'vue'

const STORAGE_KEY = 'eventhub.currentUserId'

// Shared (module-level) ref so every component that imports this composable
// reads/writes the SAME "logged in as" selection — there's no real auth,
// just a picked user id, persisted across reloads.
const currentUserId = ref(localStorage.getItem(STORAGE_KEY) || null)

watch(currentUserId, (id) => {
  if (id) {
    localStorage.setItem(STORAGE_KEY, id)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
})

export function useCurrentUser() {
  return { currentUserId }
}
