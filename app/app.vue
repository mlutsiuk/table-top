<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <SpeedInsights />

    <Toaster />
  </div>
</template>
