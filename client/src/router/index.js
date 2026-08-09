import { createRouter, createWebHistory } from 'vue-router'
import EventsListView from '@/views/EventsListView.vue'

// Only the Events List route for now (see docs/tasks.md ticket #4).
// Event Detail (/events/:id) and Create Event (/events/new) are added
// once this first page is wired up and confirmed working end to end.
const routes = [
  {
    path: '/',
    name: 'events-list',
    component: EventsListView,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
