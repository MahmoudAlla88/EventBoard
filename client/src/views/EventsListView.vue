<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { fetchEvents } from '@/api/events'
import { fetchVenues } from '@/api/venues'
import { CATEGORIES } from '@/lib/categories'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import EventCard from '@/components/events/EventCard.vue'

const ALL = '__all__' // sentinel: shadcn Select can't use an empty-string item value

const q = ref('')
const debouncedQ = ref('')
const city = ref(ALL)
const category = ref(ALL)
const page = ref(1)
const size = 10

// Simple debounce so we don't fire a request on every keystroke.
let debounceTimer
watch(q, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQ.value = value
  }, 350)
})

// Any filter change should reset back to page 1.
watch([debouncedQ, city, category], () => {
  page.value = 1
})

const { data: venues } = useQuery({ queryKey: ['venues'], queryFn: fetchVenues })
const cities = computed(() => {
  const set = new Set((venues.value || []).map((v) => v.city))
  return [...set].sort()
})

const queryParams = computed(() => ({
  q: debouncedQ.value || undefined,
  city: city.value === ALL ? undefined : city.value,
  category: category.value === ALL ? undefined : category.value,
  page: page.value,
  size,
}))

const { data, isPending, isError, error } = useQuery({
  queryKey: ['events', queryParams],
  queryFn: () => fetchEvents(queryParams.value),
  placeholderData: keepPreviousData,
})

const events = computed(() => data.value?.data || [])
const totalPages = computed(() => data.value?.totalPages || 1)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">Events</h1>
        <p class="text-muted-foreground text-sm">Browse and search upcoming events.</p>
      </div>
      <Button as-child>
        <RouterLink :to="{ name: 'create-event' }">+ Create event</RouterLink>
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <Input v-model="q" placeholder="Search title or description…" class="max-w-xs" />

      <Select v-model="city">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL">All cities</SelectItem>
          <SelectItem v-for="c in cities" :key="c" :value="c">{{ c }}</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="category">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL">All categories</SelectItem>
          <SelectItem v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="isPending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" class="h-40 w-full" />
    </div>

    <!-- Error -->
    <div v-else-if="isError" class="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      Couldn't load events: {{ error.message }}
    </div>

    <!-- Empty -->
    <div v-else-if="events.length === 0" class="rounded-md border p-8 text-center text-muted-foreground">
      No events match your search. Try different filters.
    </div>

    <!-- Results -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <EventCard v-for="event in events" :key="event._id" :event="event" />
    </div>

    <!-- Pagination -->
    <div v-if="!isPending && events.length > 0" class="flex items-center justify-center gap-3">
      <Button variant="outline" :disabled="page <= 1" @click="page--">Previous</Button>
      <span class="text-sm text-muted-foreground">Page {{ page }} of {{ totalPages }}</span>
      <Button variant="outline" :disabled="page >= totalPages" @click="page++">Next</Button>
    </div>
  </div>
</template>
