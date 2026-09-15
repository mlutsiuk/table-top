<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'

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
