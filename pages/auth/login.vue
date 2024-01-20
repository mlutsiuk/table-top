<script setup lang="ts">
definePageMeta({
  layout: 'hero'
})
</script>

<template>
  <div class="absolute right-6 top-6 flex flex-row gap-2">
    <ColorPicker />
    <ColorModeButton />
  </div>

  <div class="flex flex-col gap-4 rounded-xl bg-white p-6 dark:bg-gray-800 dark:border-gray-700 border">
    <h1 class="text-3xl font-bold">
      Log in
    </h1>

    <p>Log in to get access to great gaming experience</p>

    <UButton
      size="xl"
      variant="outline"
      block
      icon="i-logos-google-icon"
    >
      Log in with Google
    </UButton>
  </div>
</template>
