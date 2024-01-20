<script setup lang="ts">
definePageMeta({
  layout: 'hero'
})

const route = useRoute('auth-google-callback')

const { data, execute } = useFetch('/api/auth/google/callback', {
  method: 'POST',
  body: {
    code: route.query.code
  },
  immediate: false
})

onMounted(async () => {
  if (!route.query.code) {
    useToast().add({
      title: `Failed to login, try again`,
      timeout: 5000
    })
  }

  await execute()

  if (data.value) {
    useToast().add({
      title: `Hello, ${data.value.user.name}`,
      description: 'You have successfully logged in',
      timeout: 5000
    })
  }
})
</script>

<template>
  <UIcon
    name="i-svg-spinners-180-ring"
    class="text-primary size-10"
    dynamic
  />
</template>
