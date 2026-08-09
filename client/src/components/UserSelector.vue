<script setup>
import { useQuery } from '@tanstack/vue-query'
import { fetchUsers } from '@/api/users'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const { currentUserId } = useCurrentUser()

const { data: users, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})
</script>

<template>
  <div class="flex items-center gap-2 text-sm">
    <span class="text-muted-foreground whitespace-nowrap">Logged in as</span>
    <Select v-model="currentUserId" :disabled="isLoading">
      <SelectTrigger class="w-[180px]">
        <SelectValue placeholder="Select a user" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="user in users" :key="user._id" :value="user._id">
          {{ user.name }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
