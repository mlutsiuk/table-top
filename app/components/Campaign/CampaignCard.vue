<script setup lang="ts">
import type { Campaign } from '@prisma/client'

defineProps<{
  campaign: Campaign
}>()
</script>

<template>
  <KLink
    class="rounded-lg bg-gray-200 hover:bg-gray-300 p-6 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
    :to="{ name: 'campaigns-id', params: { id: campaign.id } }"
  >
    <div class="text-lg font-bold">
      {{ campaign.title }}
    </div>
  </KLink>
</template>
