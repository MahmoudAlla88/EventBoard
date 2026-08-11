<script setup>
import { useQuery } from '@tanstack/vue-query'
import { fetchTopVenues } from '@/api/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// GET /api/stats/top-venues — the one endpoint the brief requires to be an
// aggregation pipeline rather than a simple find. Surfacing it here so it's
// actually exercised from the UI, not just curl-tested.
const { data: topVenues, isPending, isError } = useQuery({
  queryKey: ['top-venues'],
  queryFn: fetchTopVenues,
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Top venues</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="isPending" class="flex flex-col gap-2">
        <Skeleton class="h-5 w-full" />
        <Skeleton class="h-5 w-full" />
        <Skeleton class="h-5 w-3/4" />
      </div>

      <p v-else-if="isError" class="text-sm text-muted-foreground">Couldn't load top venues.</p>

      <p v-else-if="!topVenues?.length" class="text-sm text-muted-foreground">
        No registrations yet.
      </p>

      <ol v-else class="flex flex-col gap-2 text-sm">
        <li
          v-for="(entry, i) in topVenues"
          :key="entry.venue._id"
          class="flex items-center justify-between gap-2"
        >
          <span class="flex items-center gap-2">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
              {{ i + 1 }}
            </span>
            <span class="line-clamp-1">{{ entry.venue.name }}</span>
          </span>
          <span class="shrink-0 font-medium text-primary">{{ entry.registrationCount }}</span>
        </li>
      </ol>
    </CardContent>
  </Card>
</template>
