<script setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchUsers } from '@/api/users'
import { useUserSlice } from '@/store/user/userSlice'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const userStore = useUserSlice()

// Always go through the store action (not a direct state mutation) so
// persistence to localStorage stays in one place (the slice itself).
const currentUserId = computed({
  get: () => userStore.currentUserId,
  set: (value) => userStore.setCurrentUser(value),
})

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
