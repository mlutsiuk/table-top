<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'hero'
})

const route = useRoute('auth-google-callback')
const router = useRouter()
const authStore = useAuthStore()

async function handleCallback() {
  const code = route.query.code

  if (typeof code !== 'string' || !code) {
    toast.error('Failed to log in, try again')
    await router.push({ name: 'auth-login' })
    return
  }

  try {
    const {
      token,
      user
    } = await useTrpc().auth.handleGoogleCallback.query({ code })

    authStore.saveToken(token)
    await authStore.fetchUser()

    toast.success(`Hello, ${user.name}`, {
      description: 'You have successfully logged in'
    })

    await router.push({ name: 'index' })
  }
  catch {
    toast.error('Failed to log in, try again')
    await router.push({ name: 'auth-login' })
  }
}

onMounted(handleCallback)
</script>

<template>
  <Loader class="size-10 text-primary" />
</template>
