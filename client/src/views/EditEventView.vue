<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchEvent, updateEvent } from '@/api/events'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import EventForm from '@/components/events/EventForm.vue'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const eventId = computed(() => route.params.id)
const serverError = ref('')

const { data: event, isPending, isError, error } = useQuery({
  queryKey: ['event', eventId],
  queryFn: () => fetchEvent(eventId.value),
})

const { mutate, isPending: isSaving } = useMutation({
  mutationFn: (payload) => updateEvent(eventId.value, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    queryClient.invalidateQueries({ queryKey: ['events'] })
    router.push({ name: 'event-detail', params: { id: eventId.value } })
  },
  onError: (err) => {
    serverError.value = err.message
  },
})
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <RouterLink :to="{ name: 'event-detail', params: { id: eventId } }" class="text-sm text-muted-foreground hover:text-foreground">
      ← Back to event
    </RouterLink>

    <div>
      <h1 class="text-2xl font-semibold">Edit event</h1>
      <p class="text-muted-foreground text-sm">Update the details below and save your changes.</p>
    </div>

    <div v-if="isPending" class="flex flex-col gap-3">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-24 w-full" />
    </div>

    <Alert v-else-if="isError" variant="destructive">
      <AlertTitle>Couldn't load this event</AlertTitle>
      <AlertDescription>{{ error.message }}</AlertDescription>
    </Alert>

    <Card v-else>
      <CardContent class="pt-6">
        <EventForm
          :initial-values="event"
          submit-label="Save changes"
          :submitting="isSaving"
          :server-error="serverError"
          @submit="mutate($event)"
        />
      </CardContent>
    </Card>
  </div>
</template>
