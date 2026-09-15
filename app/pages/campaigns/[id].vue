<script setup lang="ts">
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'

definePageMeta({
  layout: 'clear',
  middleware: 'auth'
})

const route = useRoute('campaigns-id')
const campaignStore = useCampaignStore()

campaignStore.ensureCampaign(route.params.id)
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
      class="flex flex-col items-stretch border-r border-sidebar-border bg-sidebar"
    >
      <CampaignSidebar class="grow" />
    </SplitterPanel>

    <SplitterResizeHandle
      class="w-px bg-sidebar-border transition-colors hover:bg-sidebar-ring"
    />

    <SplitterPanel
      :min-size="20"
      class="flex min-h-0 flex-col"
    >
      <NuxtPage />
    </SplitterPanel>
  </SplitterGroup>
</template>
