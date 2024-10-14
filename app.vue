<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <SpeedInsights />
  </UApp>
</template>
