<script setup>
import { useRouter } from 'vue-router'
import { useUserSlice } from '@/store/user/userSlice'
import { Button } from '@/components/ui/button'

const router = useRouter()
const userStore = useUserSlice()

function onLogout() {
  userStore.logout()
  router.push({ name: 'events-list' })
}
</script>

<template>
  <div class="flex items-center gap-3 text-sm">
    <template v-if="userStore.isLoggedIn && userStore.user">
      <span class="text-muted-foreground">
        Logged in as <span class="font-medium text-foreground">{{ userStore.user.name }}</span>
      </span>
      <Button variant="outline" size="sm" @click="onLogout">Log out</Button>
    </template>
    <template v-else>
      <RouterLink to="/login" class="text-muted-foreground hover:text-foreground">Log in</RouterLink>
      <Button as-child size="sm">
        <RouterLink to="/register">Register</RouterLink>
      </Button>
    </template>
  </div>
</template>
