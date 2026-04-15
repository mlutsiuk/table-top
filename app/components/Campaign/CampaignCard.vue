<script setup lang="ts">
import type { Campaign } from '@prisma/client'

defineProps<{
  campaign: Campaign
}>()
</script>

<template>
  <NuxtLink
    class="block rounded-lg border border-border bg-card text-card-foreground shadow-xs hover:bg-accent hover:text-accent-foreground p-6 transition-colors"
    :to="{ name: 'campaigns-id', params: { id: campaign.id } }"
  >
    <div class="text-lg font-bold">
      {{ campaign.title }}
    </div>
  </NuxtLink>
</template>
