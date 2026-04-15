<script setup lang="ts">
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'

definePageMeta({
  layout: 'clear'
})

const route = useRoute('campaigns-id')
const campaignStore = useCampaignStore()

campaignStore.fetchCampaign(route.params.id as string)
</script>

<template>
  <SplitterGroup
    direction="horizontal"
    class="grow"
    auto-save-id="materials-sidebar-splitter"
  >
    <SplitterPanel
      :min-size="15"
      :max-size="30"
      class="flex flex-col items-stretch bg-sidebar border-r border-sidebar-border"
    >
      <CampaignSidebar class="grow" />
    </SplitterPanel>

    <SplitterResizeHandle
      class="w-px bg-sidebar-border hover:bg-sidebar-ring transition-colors"
    />

    <SplitterPanel
      :min-size="20"
      class="flex flex-col px-2 py-6"
    >
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-medium">
          {{ campaignStore.campaign?.title }}
        </h1>
        <div class="text-sm text-muted-foreground">
          {{ campaignStore.campaign?.id }}
        </div>
      </div>

      <NuxtPage />
    </SplitterPanel>
  </SplitterGroup>
</template>
