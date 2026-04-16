<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const route = useRoute('campaigns-id-assets-assetid')
const assetId = computed(() => route.params.assetid as string)
const trpc = useTrpc()
const campaignStore = useCampaignStore()

const content = ref<Record<string, any> | null>(null)
const assetTitle = ref('')
const pending = ref(false)
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')

async function fetchAsset() {
  pending.value = true
  try {
    const asset = await trpc.asset.getById.query({ id: assetId.value })
    content.value = asset.content as Record<string, any> | null
    assetTitle.value = asset.title
  } finally {
    pending.value = false
  }
}

watch(assetId, fetchAsset, { immediate: true })

// Save content
const debouncedSaveContent = useDebounceFn(async (value: Record<string, any>) => {
  try {
    await trpc.asset.saveContent.mutate({ id: assetId.value, content: value })
    saveStatus.value = 'saved'
  } catch {
    saveStatus.value = 'unsaved'
  }
}, 1500)

function onContentUpdate(value: Record<string, any>) {
  content.value = value
  saveStatus.value = 'saving'
  debouncedSaveContent(value)
}

// Save title (syncs editor h1 → asset.title in DB + sidebar)
const debouncedSaveTitle = useDebounceFn(async (newTitle: string) => {
  await trpc.asset.rename.mutate({ id: assetId.value, title: newTitle || 'Untitled' })
  campaignStore.invalidateTree()
}, 1000)

function onTitleUpdate(newTitle: string) {
  if (newTitle === assetTitle.value) return
  assetTitle.value = newTitle
  debouncedSaveTitle(newTitle)
}
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
    <div class="flex justify-end px-8 pb-1 pt-2 shrink-0">
      <span
        class="text-xs text-muted-foreground transition-opacity"
        :class="saveStatus === 'saved' ? 'opacity-0' : 'opacity-100'"
      >
        {{ saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes' }}
      </span>
    </div>

    <div v-if="pending" class="flex flex-1 items-center justify-center">
      <Icon name="lucide:loader" class="size-5 animate-spin text-muted-foreground" />
    </div>

    <MaterialEditor
      v-else
      :key="assetId"
      :model-value="content"
      class="flex-1 min-h-0"
      @update:model-value="onContentUpdate"
      @update:title="onTitleUpdate"
    />
  </div>
</template>
