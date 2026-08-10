<script setup>
import UserSelector from '@/components/UserSelector.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <router-link to="/" class="text-lg font-semibold">EventHub</router-link>
        <UserSelector />
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
