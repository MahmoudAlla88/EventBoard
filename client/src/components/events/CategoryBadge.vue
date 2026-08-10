<script setup>
import { Badge } from '@/components/ui/badge'

defineProps({
  category: { type: String, required: true },
})
</script>

<template>
  <Badge variant="secondary" class="bg-accent text-accent-foreground font-normal">
    {{ category }}
  </Badge>
</template>
