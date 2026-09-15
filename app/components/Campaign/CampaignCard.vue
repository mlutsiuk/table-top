<script setup lang="ts">
import type { CampaignDto } from '#shared/types/campaign'

defineProps<{
  campaign: CampaignDto
}>()
</script>

<template>
  <NuxtLink
    class="block rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
    :to="{ name: 'campaigns-id', params: { id: campaign.id } }"
  >
    <div class="text-lg font-bold">
      {{ campaign.title }}
    </div>
  </NuxtLink>
</template>
