import { createRouter, createWebHistory } from 'vue-router'
import EventsListView from '@/views/EventsListView.vue'
import EventDetailView from '@/views/EventDetailView.vue'
import CreateEventView from '@/views/CreateEventView.vue'

const routes = [
  {
    path: '/',
    name: 'events-list',
    component: EventsListView,
  },
  {
    path: '/events/new',
    name: 'create-event',
    component: CreateEventView,
  },
  {
    path: '/events/:id',
    name: 'event-detail',
    component: EventDetailView,
    props: true,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
