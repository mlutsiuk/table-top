<script setup lang="ts">
definePageMeta({
  layout: 'hero'
})

const route = useRoute('auth-google-callback')

if (!route.query.code) {
  useToast().add({
    title: `Failed to login, try again`,
    timeout: 5000
  })

  useRouter().push('/auth/login')
}

const response = await useTrpc().auth.handleGoogleCallback.query({
  code: route.query.code as string
})
if (response) {
  useAuthStore().saveToken(response.token)

  useToast().add({
    title: `Hello, ${response.user.name}`,
    description: 'You have successfully logged in',
    timeout: 5000
  })

  useRouter().push({ name: 'index' })
}
</script>

<template>
  <UIcon
    name="i-svg-spinners-180-ring"
    class="text-primary size-10"
    dynamic
  />
</template>
