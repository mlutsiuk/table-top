<script setup lang="ts">
import type { CampaignStatus } from '#shared/types/campaign'

const route = useRoute('campaigns-id')
const campaignId = computed(() => route.params.id as string)
const campaignStore = useCampaignStore()

const statusLabel: Record<CampaignStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived'
}
</script>

<template>
  <div class="flex h-full flex-col text-sidebar-foreground">
    <!-- Campaign header -->
    <div class="px-3 py-3">
      <div class="truncate text-sm font-semibold leading-tight">
        {{ campaignStore.campaign?.title ?? '...' }}
      </div>
      <div class="mt-0.5 text-xs text-muted-foreground">
        {{ campaignStore.campaign ? statusLabel[campaignStore.campaign.status] : '' }}
        <template v-if="campaignStore.campaign && !campaignStore.isMaster">
          · Player
        </template>
      </div>
    </div>

    <div class="mx-2 border-t border-sidebar-border" />

    <!-- Nav -->
    <nav class="flex flex-col gap-0.5 p-2">
      <NuxtLink
        :to="{ name: 'campaigns-id', params: { id: campaignId } }"
        exact-active-class="bg-sidebar-accent text-sidebar-accent-foreground"
        class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Icon name="lucide:layout-dashboard" class="size-4 shrink-0" />
        Overview
      </NuxtLink>
      <NuxtLink
        v-if="can('campaign:update')"
        :to="{ name: 'campaigns-id-settings', params: { id: campaignId } }"
        active-class="bg-sidebar-accent text-sidebar-accent-foreground"
        class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Icon name="lucide:settings" class="size-4 shrink-0" />
        Settings
      </NuxtLink>
    </nav>

    <div class="mx-2 border-t border-sidebar-border" />

    <!-- Folder tree -->
    <div class="min-h-0 flex-1">
      <SidebarFolderTree :campaign-id="campaignId" />
    </div>
  </div>
</template>
