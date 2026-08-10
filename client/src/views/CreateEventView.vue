<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { createEvent } from '@/api/events'
import { fetchVenues } from '@/api/venues'
import { fetchUsers } from '@/api/users'
import { CATEGORIES } from '@/lib/categories'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const router = useRouter()

const { data: venues } = useQuery({ queryKey: ['venues'], queryFn: fetchVenues })
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

const form = reactive({
  title: '',
  description: '',
  startsAt: '',
  price: '',
  venue: '',
  organizer: '',
  categories: [],
})

const errors = reactive({})
const submitError = ref('')

function toggleCategory(cat) {
  const i = form.categories.indexOf(cat)
  if (i === -1) form.categories.push(cat)
  else form.categories.splice(i, 1)
}

// Mirrors the backend's required-field validation (see
// backend/controllers/eventController.js) so the user gets instant
// feedback instead of a round trip for something obviously missing.
function validate() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.title.trim()) errors.title = 'Title is required'
  if (!form.description.trim()) errors.description = 'Description is required'
  if (!form.startsAt) errors.startsAt = 'Start date/time is required'
  if (form.price === '' || Number(form.price) < 0) errors.price = 'Price must be 0 or more'
  if (!form.venue) errors.venue = 'Venue is required'
  if (!form.organizer) errors.organizer = 'Organizer is required'
  return Object.keys(errors).length === 0
}

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    createEvent({
      title: form.title.trim(),
      description: form.description.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      price: Number(form.price),
      venue: form.venue,
      organizer: form.organizer,
      categories: form.categories,
    }),
  onSuccess: (created) => {
    router.push({ name: 'event-detail', params: { id: created._id } })
  },
  onError: (err) => {
    submitError.value = err.message
  },
})

function onSubmit() {
  submitError.value = ''
  if (!validate()) return
  mutate()
}
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
        <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1.5">
            <Label for="title">Title</Label>
            <Input id="title" v-model="form.title" placeholder="Tech Meetup: JS Frameworks" />
            <p v-if="errors.title" class="text-sm text-destructive">{{ errors.title }}</p>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="description">Description</Label>
            <Textarea id="description" v-model="form.description" rows="4" placeholder="What is this event about?" />
            <p v-if="errors.description" class="text-sm text-destructive">{{ errors.description }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <Label for="startsAt">Starts at</Label>
              <Input id="startsAt" v-model="form.startsAt" type="datetime-local" />
              <p v-if="errors.startsAt" class="text-sm text-destructive">{{ errors.startsAt }}</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="price">Price ($)</Label>
              <Input id="price" v-model="form.price" type="number" min="0" step="0.01" placeholder="0" />
              <p v-if="errors.price" class="text-sm text-destructive">{{ errors.price }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <Label>Venue</Label>
              <Select v-model="form.venue">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="v in venues" :key="v._id" :value="v._id">
                    {{ v.name }} ({{ v.city }})
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="errors.venue" class="text-sm text-destructive">{{ errors.venue }}</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Organizer</Label>
              <Select v-model="form.organizer">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select an organizer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="u in users" :key="u._id" :value="u._id">{{ u.name }}</SelectItem>
                </SelectContent>
              </Select>
              <p v-if="errors.organizer" class="text-sm text-destructive">{{ errors.organizer }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Categories</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in CATEGORIES"
                :key="cat"
                type="button"
                :class="cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors',
                  form.categories.includes(cat)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent'
                )"
                @click="toggleCategory(cat)"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <Alert v-if="submitError" variant="destructive">
            <AlertDescription>{{ submitError }}</AlertDescription>
          </Alert>

          <Button type="submit" :disabled="isPending">
            {{ isPending ? 'Creating…' : 'Create event' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
