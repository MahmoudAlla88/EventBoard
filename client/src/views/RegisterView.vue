<script setup>
import { reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUserSlice } from '@/store/user/userSlice'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const router = useRouter()
const userStore = useUserSlice()

const form = reactive({ name: '', email: '', password: '' })
const error = ref('')
const isSubmitting = ref(false)

async function onSubmit() {
  error.value = ''
  isSubmitting.value = true
  try {
    await userStore.register(form.name, form.email, form.password)
    router.push({ name: 'events-list' })
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
      <h1 class="text-2xl font-semibold">Create an account</h1>
      <p class="text-muted-foreground text-sm">Register to create events and register for others.</p>
    </div>

    <Card>
      <CardContent class="pt-6">
        <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1.5">
            <Label for="name">Name</Label>
            <Input id="name" v-model="form.name" placeholder="Your name" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="email">Email</Label>
            <Input id="email" v-model="form.email" type="email" placeholder="you@example.com" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="password">Password</Label>
            <Input id="password" v-model="form.password" type="password" minlength="6" required />
            <p class="text-xs text-muted-foreground">At least 6 characters.</p>
          </div>

          <Alert v-if="error" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creating account…' : 'Register' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <p class="text-center text-sm text-muted-foreground">
      Already have an account? <RouterLink to="/login" class="text-primary hover:underline">Log in</RouterLink>
    </p>
  </div>
</template>
