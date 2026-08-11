import { createRouter, createWebHistory } from 'vue-router'
import EventsListView from '@/views/EventsListView.vue'
import EventDetailView from '@/views/EventDetailView.vue'
import CreateEventView from '@/views/CreateEventView.vue'
import EditEventView from '@/views/EditEventView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import { useUserSlice } from '@/store/user/userSlice'

const routes = [
  {
    path: '/',
    name: 'events-list',
    component: EventsListView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
  {
    path: '/events/new',
    name: 'create-event',
    component: CreateEventView,
    meta: { requiresAuth: true },
  },
  {
    path: '/events/:id',
    name: 'event-detail',
    component: EventDetailView,
    props: true,
  },
  {
    path: '/events/:id/edit',
    name: 'edit-event',
    component: EditEventView,
    props: true,
    meta: { requiresAuth: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Routes flagged requiresAuth (create/edit event) need a logged-in user —
// the backend enforces this too (401/403), this guard just avoids sending
// a logged-out visitor straight into a form they can't submit.
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !useUserSlice().isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
