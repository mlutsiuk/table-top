<script setup lang="ts">
const route = useRoute('campaigns-id')
const campaignId = computed(() => route.params.id as string)
</script>

<template>
  <div class="flex h-full flex-col text-sidebar-foreground">
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
