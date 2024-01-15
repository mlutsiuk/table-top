<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'

</script>

<template>
  <div>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <SpeedInsights />
  </div>
</template>
