<script lang="ts">
export type AssetNode = {
  id: string
  title: string
  type: 'asset'
  folderId: string
}

export type FolderNode = {
  id: string
  title: string
  type: 'folder'
  parentId: string | null
  children: TreeNode[]
}

export type TreeNode = FolderNode | AssetNode

export type TreeContext = {
  editingId: Ref<string | null>
  editingTitle: Ref<string>
  startRename: (type: 'folder' | 'asset', id: string, currentTitle: string) => void
  submitRename: (type: 'folder' | 'asset', id: string) => Promise<void>
  cancelRename: () => void
  addFolder: (parentId: string | null) => Promise<void>
  addAsset: (folderId: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
}

export const TREE_CONTEXT_KEY = Symbol('treeContext')
</script>

<script setup lang="ts">
const props = defineProps<{ campaignId: string }>()

const trpc = useTrpc()

// --- Data ---

const rawData = ref<{ folders: { id: string; title: string; parentId: string | null }[]; assets: { id: string; title: string; folderId: string }[] } | null>(null)
const pending = ref(false)

async function fetchTree() {
  pending.value = true
  try {
    rawData.value = await trpc.folder.getTree.query({ campaignId: props.campaignId })
  } finally {
    pending.value = false
  }
}

const campaignStore = useCampaignStore()

onMounted(fetchTree)
watch(() => campaignStore.treeVersion, fetchTree)

const treeItems = computed<TreeNode[]>(() => {
  if (!rawData.value) return []
  const { folders, assets } = rawData.value

  const folderMap = new Map<string, FolderNode>()
  for (const f of folders) {
    folderMap.set(f.id, { ...f, type: 'folder', children: [] })
  }

  const roots: TreeNode[] = []
  for (const folder of folderMap.values()) {
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(folder)
    } else {
      roots.push(folder)
    }
  }

  for (const asset of assets) {
    folderMap.get(asset.folderId)?.children.push({ ...asset, type: 'asset' })
  }

  return roots
})

// --- Rename ---

const editingId = ref<string | null>(null)
const editingTitle = ref('')

function startRename(type: 'folder' | 'asset', id: string, currentTitle: string) {
  editingId.value = id
  editingTitle.value = currentTitle
  nextTick(() => {
    document.getElementById(`rename-input-${id}`)?.focus()
    ;(document.getElementById(`rename-input-${id}`) as HTMLInputElement)?.select()
  })
}

async function submitRename(type: 'folder' | 'asset', id: string) {
  const title = editingTitle.value.trim()
  if (!title) { editingId.value = null; return }

  if (type === 'folder') {
    await trpc.folder.rename.mutate({ id, title })
  } else {
    await trpc.asset.rename.mutate({ id, title })
  }
  editingId.value = null
  await fetchTree()
}

function cancelRename() {
  editingId.value = null
}

// --- Create ---

async function addFolder(parentId: string | null) {
  const folder = await trpc.folder.create.mutate({
    campaignId: props.campaignId,
    parentId: parentId ?? undefined,
    title: 'New Folder'
  })
  await fetchTree()
  startRename('folder', folder.id, folder.title)
}

async function addAsset(folderId: string) {
  const asset = await trpc.asset.create.mutate({
    campaignId: props.campaignId,
    folderId,
    title: 'New Asset'
  })
  await fetchTree()
  startRename('asset', asset.id, asset.title)
}

// --- Delete ---

async function deleteFolder(id: string) {
  await trpc.folder.delete.mutate({ id })
  await fetchTree()
}

async function deleteAsset(id: string) {
  await trpc.asset.delete.mutate({ id })
  await fetchTree()
}

provide<TreeContext>(TREE_CONTEXT_KEY, {
  editingId,
  editingTitle,
  startRename,
  submitRename,
  cancelRename,
  addFolder,
  addAsset,
  deleteFolder,
  deleteAsset
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Materials
      </span>
      <button
        class="rounded p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        title="New folder"
        @click="addFolder(null)"
      >
        <Icon name="lucide:folder-plus" class="size-4" />
      </button>
    </div>

    <!-- Tree -->
    <div class="flex-1 overflow-y-auto px-1 pb-2">
      <div v-if="pending" class="flex justify-center py-4">
        <Icon name="lucide:loader" class="size-4 animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="treeItems.length === 0" class="px-2 py-3 text-xs text-muted-foreground">
        No folders yet
      </div>

      <template v-else>
        <SidebarFolderTreeNode
          v-for="node in treeItems"
          :key="node.id"
          :node="node"
          :level="0"
        />
      </template>
    </div>
  </div>
</template>
