<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useUserSlice } from '@/store/user/userSlice'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const router = useRouter()
const route = useRoute()
const userStore = useUserSlice()

const form = reactive({ email: '', password: '' })
const error = ref('')
const isSubmitting = ref(false)

async function onSubmit() {
  error.value = ''
  isSubmitting.value = true
  try {
    await userStore.login(form.email, form.password)
    router.push(route.query.redirect || { name: 'events-list' })
  } catch (err) {
    error.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-sm flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold">Log in</h1>
      <p class="text-muted-foreground text-sm">
        Seeded users all use the password
        <code class="rounded bg-muted px-1 py-0.5">Password123!</code>
        (e.g. alice@example.com).
      </p>
    </div>

    <Card>
      <CardContent class="pt-6">
        <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1.5">
            <Label for="email">Email</Label>
            <Input id="email" v-model="form.email" type="email" placeholder="alice@example.com" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="password">Password</Label>
            <Input id="password" v-model="form.password" type="password" required />
          </div>

          <Alert v-if="error" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Logging in…' : 'Log in' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <p class="text-center text-sm text-muted-foreground">
      No account? <RouterLink to="/register" class="text-primary hover:underline">Register</RouterLink>
    </p>
  </div>
</template>
