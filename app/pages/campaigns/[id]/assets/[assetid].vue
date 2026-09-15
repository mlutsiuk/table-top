<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { sanitizeLine } from '#shared/validation/text'

const route = useRoute('campaigns-id-assets-assetid')
const assetId = computed(() => route.params.assetid)
const campaignId = computed(() => route.params.id)
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
  }
  finally {
    pending.value = false
  }
}

watch(assetId, fetchAsset, { immediate: true })

// Save content
/**
 * The reason the last save failed, so it is shown once rather than on every retry:
 * each edit saves again, and a document over the size limit fails every time.
 */
let lastSaveError = ''

const debouncedSaveContent = useDebounceFn(async (value: Record<string, any>) => {
  try {
    await trpc.asset.saveContent.mutate({ id: assetId.value, content: value })
    saveStatus.value = 'saved'
    lastSaveError = ''
  }
  catch (e) {
    saveStatus.value = 'unsaved'

    const message = e instanceof Error ? e.message : String(e)
    if (message !== lastSaveError)
      notifyError(e, 'Could not save the page')
    lastSaveError = message
  }
}, 1500)

function onContentUpdate(value: Record<string, any>) {
  content.value = value
  saveStatus.value = 'saving'
  debouncedSaveContent(value)
}

// Save title (syncs editor h1 → asset.title in DB + sidebar)
const debouncedSaveTitle = useDebounceFn(async (newTitle: string) => {
  // Cleaned here too: a heading of only invisible characters would otherwise be
  // refused by the server instead of falling back to a readable title.
  await trpc.asset.rename.mutate({ id: assetId.value, title: sanitizeLine(newTitle) || 'Untitled' })
  campaignStore.invalidateTree()
}, 1000)

function onTitleUpdate(newTitle: string) {
  if (newTitle === assetTitle.value)
    return
  assetTitle.value = newTitle
  debouncedSaveTitle(newTitle)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-row">
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex shrink-0 justify-end px-8 pt-2 pb-1">
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
        class="min-h-0 flex-1"
        @update:model-value="onContentUpdate"
        @update:title="onTitleUpdate"
      />
    </div>

    <MaterialTraits
      :asset-id="assetId"
      :campaign-id="campaignId"
      class="w-80 shrink-0 overflow-y-auto border-l border-border"
    />
  </div>
</template>
