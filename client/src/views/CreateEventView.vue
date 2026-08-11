<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { createEvent } from '@/api/events'
import { Card, CardContent } from '@/components/ui/card'
import EventForm from '@/components/events/EventForm.vue'

const router = useRouter()
const serverError = ref('')

const { mutate, isPending } = useMutation({
  mutationFn: (payload) => createEvent(payload),
  onSuccess: (created) => {
    router.push({ name: 'event-detail', params: { id: created._id } })
  },
  onError: (err) => {
    serverError.value = err.message
  },
})
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <RouterLink to="/" class="text-sm text-muted-foreground hover:text-foreground">← Back to events</RouterLink>

    <div>
      <h1 class="text-2xl font-semibold">Create event</h1>
      <p class="text-muted-foreground text-sm">Fill in the details below to publish a new event.</p>
    </div>

    <Card>
      <CardContent class="pt-6">
        <EventForm
          submit-label="Create event"
          :submitting="isPending"
          :server-error="serverError"
          @submit="mutate($event)"
        />
      </CardContent>
    </Card>
  </div>
</template>
