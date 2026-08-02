<script setup lang="ts">
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'

definePageMeta({
  layout: 'clear'
})

const route = useRoute('campaigns-id')
const campaignStore = useCampaignStore()

campaignStore.ensureCampaign(route.params.id as string)
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
      class="flex min-h-0 flex-col"
    >
      <NuxtPage />
    </SplitterPanel>
  </SplitterGroup>
</template>
