<script setup>
import { reactive, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchVenues } from '@/api/venues'
import { fetchUsers } from '@/api/users'
import { CATEGORIES } from '@/lib/categories'
import { toDatetimeLocalValue } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Shared by CreateEventView (no initialValues) and EditEventView
// (initialValues = the event being edited). The parent owns the actual
// createEvent/updateEvent mutation call and just listens for `submit`.
const props = defineProps({
  initialValues: { type: Object, default: null },
  submitLabel: { type: String, default: 'Save' },
  submitting: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})
const emit = defineEmits(['submit'])

const { data: venues } = useQuery({ queryKey: ['venues'], queryFn: fetchVenues })
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

function blankForm() {
  return { title: '', description: '', startsAt: '', price: '', venue: '', organizer: '', categories: [] }
}

const form = reactive(blankForm())
const errors = reactive({})

// Fill the form once the event to edit is passed in (it may arrive async,
// after the initial GET /api/events/:id resolves).
watch(
  () => props.initialValues,
  (values) => {
    if (!values) return
    form.title = values.title
    form.description = values.description
    form.startsAt = toDatetimeLocalValue(values.startsAt)
    form.price = values.price
    form.venue = values.venue?._id || values.venue
    form.organizer = values.organizer?._id || values.organizer
    form.categories = [...(values.categories || [])]
  },
  { immediate: true }
)

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

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    startsAt: new Date(form.startsAt).toISOString(),
    price: Number(form.price),
    venue: form.venue,
    organizer: form.organizer,
    categories: form.categories,
  })
}
</script>

<template>
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
            <SelectItem v-for="v in venues" :key="v._id" :value="v._id">{{ v.name }} ({{ v.city }})</SelectItem>
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

    <Alert v-if="serverError" variant="destructive">
      <AlertDescription>{{ serverError }}</AlertDescription>
    </Alert>

    <Button type="submit" :disabled="submitting">
      {{ submitting ? 'Saving…' : submitLabel }}
    </Button>
  </form>
</template>
