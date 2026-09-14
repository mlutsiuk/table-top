<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'

const speedInsights = !import.meta.dev
</script>

<template>
  <div>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <SpeedInsights v-if="speedInsights" />

    <Toaster />
  </div>
</template>
