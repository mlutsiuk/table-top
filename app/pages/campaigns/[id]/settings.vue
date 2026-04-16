<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { CampaignStatus } from '@prisma/client'

const campaignStore = useCampaignStore()

const title = ref('')
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')

watch(
  () => campaignStore.campaign,
  (campaign) => {
    if (campaign) title.value = campaign.title
  },
  { immediate: true },
)

const debouncedSaveTitle = useDebounceFn(async (value: string) => {
  if (!value.trim()) return
  saveStatus.value = 'saving'
  await campaignStore.updateCampaign({ title: value.trim() })
  saveStatus.value = 'saved'
}, 1000)

function onTitleInput(e: Event) {
  title.value = (e.target as HTMLInputElement).value
  saveStatus.value = 'unsaved'
  debouncedSaveTitle(title.value)
}

async function setStatus(status: CampaignStatus) {
  if (campaignStore.campaign?.status === status) return
  await campaignStore.updateCampaign({ status })
}

const statuses: { value: CampaignStatus; label: string; description: string }[] = [
  { value: 'DRAFT', label: 'Draft', description: 'Work in progress' },
  { value: 'ACTIVE', label: 'Active', description: 'Campaign is running' },
  { value: 'ARCHIVED', label: 'Archived', description: 'No longer active' },
]

const createdAt = computed(() => {
  if (!campaignStore.campaign) return ''
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(campaignStore.campaign.createdAt),
  )
})
</script>

<template>
  <div class="flex flex-col gap-10 px-8 py-6 max-w-xl">
    <!-- General -->
    <section class="flex flex-col gap-5">
      <div>
        <h2 class="text-base font-semibold">General</h2>
        <p class="text-sm text-muted-foreground">Basic campaign information</p>
      </div>

      <!-- Title -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium" for="campaign-title">Name</label>
        <div class="relative">
          <input
            id="campaign-title"
            :value="title"
            type="text"
            class="file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            @input="onTitleInput"
          />
          <span
            class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground transition-opacity"
            :class="saveStatus === 'saved' ? 'opacity-0' : 'opacity-100'"
          >
            {{ saveStatus === 'saving' ? 'Saving…' : '●' }}
          </span>
        </div>
      </div>

      <!-- Status -->
      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium">Status</span>
        <div class="flex gap-2">
          <button
            v-for="s in statuses"
            :key="s.value"
            class="flex flex-1 flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors"
            :class="campaignStore.campaign?.status === s.value
              ? 'border-ring bg-accent text-accent-foreground'
              : 'border-border hover:bg-accent/50'"
            @click="setStatus(s.value)"
          >
            <span class="font-medium">{{ s.label }}</span>
            <span class="text-xs text-muted-foreground">{{ s.description }}</span>
          </button>
        </div>
      </div>
    </section>

    <div class="border-t border-border" />

    <!-- Meta -->
    <section class="flex flex-col gap-3">
      <h2 class="text-base font-semibold">Info</h2>
      <div class="flex flex-col gap-2 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Campaign ID</span>
          <span class="font-mono text-xs text-muted-foreground">{{ campaignStore.campaign?.id }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Created</span>
          <span>{{ createdAt }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
