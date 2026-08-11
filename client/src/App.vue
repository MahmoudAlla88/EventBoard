<script setup>
import AuthStatus from '@/components/AuthStatus.vue'
import { useUserSlice } from '@/store/user/userSlice'

// Restore a logged-in session from a stored token (if any) once, on app start.
useUserSlice().restoreSession()
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <router-link to="/" class="text-lg font-semibold">EventHub</router-link>
        <AuthStatus />
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
