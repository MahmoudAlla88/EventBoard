<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchEvent, fetchAttendees, registerForEvent, deleteEvent } from '@/api/events'
import { useUserSlice } from '@/store/user/userSlice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import CategoryBadge from '@/components/events/CategoryBadge.vue'
import { formatDateTime, formatPrice } from '@/lib/format'

const route = useRoute()
const router = useRouter()
const eventId = computed(() => route.params.id)

const userStore = useUserSlice()
const queryClient = useQueryClient()

const {
  data: event,
  isPending,
  isError,
  error,
} = useQuery({
  queryKey: ['event', eventId],
  queryFn: () => fetchEvent(eventId.value),
})

const { data: attendees, isPending: attendeesPending } = useQuery({
  queryKey: ['attendees', eventId],
  queryFn: () => fetchAttendees(eventId.value),
})

// Only the organizer sees Edit/Delete — the backend enforces this too
// (403 otherwise), this is just so a logged-in-but-not-owner visitor
// doesn't see buttons that would fail.
const isOwner = computed(
  () => userStore.isLoggedIn && event.value?.organizer?._id === userStore.currentUserId
)

const registerError = ref('')
const registerSuccess = ref(false)

const { mutate: register, isPending: isRegistering } = useMutation({
  // No `user` in the body anymore — the backend registers whoever the JWT
  // says is logged in (see backend/controllers/eventController.js).
  mutationFn: () => registerForEvent(eventId.value, {}),
  onSuccess: () => {
    registerError.value = ''
    registerSuccess.value = true
    queryClient.invalidateQueries({ queryKey: ['attendees', eventId] })
    queryClient.invalidateQueries({ queryKey: ['events'] })
  },
  onError: (err) => {
    registerSuccess.value = false
    registerError.value = err.message
  },
})

const alreadyRegistered = computed(() =>
  (attendees.value || []).some((r) => r.user?._id === userStore.currentUserId)
)

const deleteError = ref('')

const { mutate: removeEvent, isPending: isDeleting } = useMutation({
  mutationFn: () => deleteEvent(eventId.value),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
    router.push({ name: 'events-list' })
  },
  onError: (err) => {
    deleteError.value = err.message
  },
})

function onDelete() {
  if (window.confirm('Delete this event? This also removes its registrations.')) {
    removeEvent()
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <RouterLink to="/" class="text-sm text-muted-foreground hover:text-foreground">← Back to events</RouterLink>
      <div v-if="isOwner" class="flex gap-2">
        <Button as-child variant="outline" size="sm">
          <RouterLink :to="{ name: 'edit-event', params: { id: eventId } }">Edit</RouterLink>
        </Button>
        <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" :disabled="isDeleting" @click="onDelete">
          {{ isDeleting ? 'Deleting…' : 'Delete' }}
        </Button>
      </div>
    </div>

    <Alert v-if="deleteError" variant="destructive">
      <AlertDescription>{{ deleteError }}</AlertDescription>
    </Alert>

    <!-- Loading -->
    <div v-if="isPending" class="flex flex-col gap-4">
      <Skeleton class="h-8 w-2/3" />
      <Skeleton class="h-40 w-full" />
    </div>

    <!-- Error -->
    <Alert v-else-if="isError" variant="destructive">
      <AlertTitle>Couldn't load this event</AlertTitle>
      <AlertDescription>{{ error.message }}</AlertDescription>
    </Alert>

    <!-- Content -->
    <div v-else-if="event" class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 flex flex-col gap-4">
        <div>
          <h1 class="text-2xl font-semibold">{{ event.title }}</h1>
          <p class="text-muted-foreground text-sm">{{ formatDateTime(event.startsAt) }}</p>
        </div>

        <div v-if="event.categories?.length" class="flex flex-wrap gap-1">
          <CategoryBadge v-for="cat in event.categories" :key="cat" :category="cat" />
        </div>

        <p class="leading-relaxed">{{ event.description }}</p>

        <Separator />

        <div>
          <h2 class="mb-2 font-medium">Attendees</h2>
          <div v-if="attendeesPending" class="flex flex-col gap-2">
            <Skeleton class="h-6 w-40" />
            <Skeleton class="h-6 w-32" />
          </div>
          <p v-else-if="!attendees?.length" class="text-sm text-muted-foreground">
            No one has registered yet — be the first!
          </p>
          <ul v-else class="flex flex-col gap-1 text-sm">
            <li v-for="reg in attendees" :key="reg._id" class="flex justify-between">
              <span>{{ reg.user?.name }}</span>
              <span class="text-muted-foreground">{{ reg.ticketCount }} ticket(s)</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Sidebar: venue, organizer, price, register -->
      <Card class="h-fit">
        <CardHeader>
          <CardTitle class="text-lg">{{ formatPrice(event.price) }}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-4 text-sm">
          <div>
            <p class="font-medium">Venue</p>
            <p class="text-muted-foreground">
              {{ event.venue?.name }}<br />
              {{ event.venue?.address }}, {{ event.venue?.city }}<br />
              Capacity: {{ event.venue?.capacity }}
            </p>
          </div>
          <div>
            <p class="font-medium">Organizer</p>
            <p class="text-muted-foreground">{{ event.organizer?.name }}</p>
          </div>

          <Separator />

          <Alert v-if="!userStore.isLoggedIn" class="border-none p-0">
            <AlertDescription class="text-muted-foreground">
              <RouterLink :to="{ name: 'login', query: { redirect: $route.fullPath } }" class="text-primary hover:underline">
                Log in
              </RouterLink>
              to register.
            </AlertDescription>
          </Alert>

          <template v-else>
            <Button :disabled="isRegistering || alreadyRegistered" @click="register()">
              <span v-if="alreadyRegistered">Already registered</span>
              <span v-else-if="isRegistering">Registering…</span>
              <span v-else>Register</span>
            </Button>

            <Alert v-if="registerSuccess" class="border-none p-0">
              <AlertDescription class="text-primary">You're registered! 🎉</AlertDescription>
            </Alert>
            <Alert v-else-if="registerError" variant="destructive" class="border-none p-0">
              <AlertDescription>{{ registerError }}</AlertDescription>
            </Alert>
          </template>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
