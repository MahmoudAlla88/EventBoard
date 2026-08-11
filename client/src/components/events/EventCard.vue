<script setup>
import { RouterLink } from 'vue-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CategoryBadge from './CategoryBadge.vue'
import { formatDateTime, formatPrice } from '@/lib/format'

defineProps({
  event: { type: Object, required: true },
})
</script>

<template>
  <RouterLink :to="{ name: 'event-detail', params: { id: event._id } }">
    <Card class="h-full transition-colors hover:border-primary/50">
      <CardHeader>
        <CardTitle class="line-clamp-1">{{ event.title }}</CardTitle>
        <CardDescription>{{ formatDateTime(event.startsAt) }}</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-2 text-sm">
        <p class="text-muted-foreground line-clamp-2">{{ event.description }}</p>
        <p v-if="event.venue">{{ event.venue.name }} · {{ event.venue.city }}</p>
        <p class="font-medium text-primary">{{ formatPrice(event.price) }}</p>
        <div v-if="event.categories?.length" class="flex flex-wrap gap-1">
          <CategoryBadge v-for="cat in event.categories" :key="cat" :category="cat" />
        </div>
      </CardContent>
    </Card>
  </RouterLink>
</template>
