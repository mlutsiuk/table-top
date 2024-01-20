<script setup lang="ts">
definePageMeta({
  layout: 'hero'
})

const inLoading = ref(false)
const login = async () => {
  inLoading.value = true
  const { data } = await useFetch('/api/auth/google/redirect')

  if (data.value) {
    const { redirectUrl } = data.value

    navigateTo(redirectUrl, {
      external: true
    })
  }
}
</script>

<template>
  <div class="absolute right-6 top-6 flex flex-row gap-2">
    <ColorPicker />
    <ColorModeButton />
  </div>

  <div class="flex flex-col gap-4 rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
    <h1 class="text-3xl font-bold">
      Log in
    </h1>

    <p>Log in to get access to great gaming experience</p>

    <UButton
      size="xl"
      variant="outline"
      block
      icon="i-logos-google-icon"
      :loading="inLoading"
      @click="login"
    >
      Log in with Google
    </UButton>
  </div>
</template>
