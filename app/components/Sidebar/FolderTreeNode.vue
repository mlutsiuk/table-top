<script setup lang="ts">
import type { TreeNode, TreeContext, FolderNode } from './FolderTree.vue'
import { TREE_CONTEXT_KEY } from './FolderTree.vue'
import FolderTreeNode from './FolderTreeNode.vue'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

const props = defineProps<{
  node: TreeNode
  level: number
}>()

const route = useRoute()
const ctx = inject<TreeContext>(TREE_CONTEXT_KEY)!

const params = computed(() => route.params as { id: string, assetid?: string })

const isExpanded = ref(true)

const paddingLeft = computed(() => `${props.level * 0.875 + 0.5}rem`)

const isAsset = computed(() => props.node.type === 'asset')
const isFolder = computed(() => props.node.type === 'folder')

const isEditing = computed(() => ctx.editingId.value === props.node.id)

const isActiveAsset = computed(() => {
  if (!isAsset.value) return false
  return params.value.assetid === props.node.id
})

function onRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') ctx.submitRename(props.node.type, props.node.id)
  if (e.key === 'Escape') ctx.cancelRename()
}

// --- Drag-and-drop ---

const dragOverCount = ref(0)
const isDragOver = computed(() => isFolder.value && dragOverCount.value > 0)

function onDragStart(e: DragEvent) {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('application/x-tree-node', JSON.stringify({
    id: props.node.id,
    type: props.node.type,
    title: props.node.title
  }))
  ctx.draggedNode.value = props.node
}

function onDragEnd() {
  ctx.draggedNode.value = null
  dragOverCount.value = 0
}

function onDragEnter(e: DragEvent) {
  if (!isFolder.value) return
  if (ctx.draggedNode.value?.id === props.node.id) return
  e.preventDefault()
  dragOverCount.value++
}

function onDragOver(e: DragEvent) {
  if (!isFolder.value) return
  if (ctx.draggedNode.value?.id === props.node.id) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onDragLeave() {
  dragOverCount.value = Math.max(0, dragOverCount.value - 1)
}

function onDrop(e: DragEvent) {
  dragOverCount.value = 0
  if (!isFolder.value || !e.dataTransfer) return
  e.preventDefault()

  const raw = e.dataTransfer.getData('application/x-tree-node')
  if (!raw) return
  const data = JSON.parse(raw) as { id: string; type: 'folder' | 'asset'; title: string }
  if (data.id === props.node.id) return

  ctx.requestMove(data.id, data.type, data.title, props.node.id, props.node.title)
  ctx.draggedNode.value = null
}
</script>

<template>
  <div>
    <ContextMenu>
      <ContextMenuTrigger as-child>
        <!-- Row -->
        <div
          class="group/row relative flex items-center gap-1 rounded py-0.5 pr-1 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          :class="{
            'bg-sidebar-accent text-sidebar-accent-foreground': isActiveAsset,
            'ring-1 ring-inset ring-primary/50 bg-primary/5': isDragOver,
          }"
          :style="{ paddingLeft }"
          :draggable="ctx.canEdit.value"
          @dragstart="onDragStart"
          @dragend="onDragEnd"
          @dragenter="onDragEnter"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <!-- Expand toggle for folders -->
          <button
            v-if="isFolder"
            class="shrink-0 text-muted-foreground hover:text-sidebar-accent-foreground"
            @click="isExpanded = !isExpanded"
          >
            <Icon
              :name="isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
              class="size-3.5"
            />
          </button>
          <span v-else class="size-3.5 shrink-0" />

          <!-- Icon -->
          <Icon
            v-if="isFolder"
            :name="isExpanded ? 'lucide:folder-open' : 'lucide:folder'"
            class="size-4 shrink-0 text-muted-foreground"
          />
          <Icon
            v-else
            name="lucide:file-text"
            class="size-4 shrink-0 text-muted-foreground"
          />

          <!-- Title / rename input -->
          <input
            v-if="isEditing"
            :id="`rename-input-${node.id}`"
            v-model="ctx.editingTitle.value"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none border-b border-ring"
            @keydown="onRenameKeydown"
            @blur="ctx.cancelRename"
          />
          <NuxtLink
            v-else-if="isAsset"
            :to="{
              name: 'campaigns-id-assets-assetid',
              params: {
                id: params.id,
                assetid: node.id
              }
            }"
            class="min-w-0 flex-1 truncate"
            @click.stop
          >
            {{ node.title }}
          </NuxtLink>
          <span v-else class="min-w-0 flex-1 truncate">{{ node.title }}</span>

          <!-- Hover action buttons -->
          <div
            v-if="ctx.canEdit.value && !isEditing"
            class="ml-auto hidden shrink-0 items-center gap-0.5 group-hover/row:flex"
          >
            <template v-if="isFolder">
              <button
                class="rounded p-0.5 hover:bg-sidebar-ring/20 transition-colors"
                title="New asset"
                @click.stop="ctx.addAsset(node.id)"
              >
                <Icon name="lucide:file-plus" class="size-3.5" />
              </button>
              <button
                class="rounded p-0.5 hover:bg-sidebar-ring/20 transition-colors"
                title="New subfolder"
                @click.stop="ctx.addFolder(node.id)"
              >
                <Icon name="lucide:folder-plus" class="size-3.5" />
              </button>
            </template>
            <button
              class="rounded p-0.5 hover:bg-sidebar-ring/20 transition-colors"
              title="Rename"
              @click.stop="ctx.startRename(node.type, node.id, node.title)"
            >
              <Icon name="lucide:pencil" class="size-3.5" />
            </button>
            <button
              class="rounded p-0.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Delete"
              @click.stop="isFolder ? ctx.deleteFolder(node.id) : ctx.deleteAsset(node.id)"
            >
              <Icon name="lucide:trash-2" class="size-3.5" />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent
        v-if="ctx.canEdit.value"
        class="w-48"
      >
        <template v-if="isFolder">
          <ContextMenuItem @click="ctx.addAsset(node.id)">
            <Icon name="lucide:file-plus" class="size-3.5 mr-2" />
            New Asset
          </ContextMenuItem>
          <ContextMenuItem @click="ctx.addFolder(node.id)">
            <Icon name="lucide:folder-plus" class="size-3.5 mr-2" />
            New Subfolder
          </ContextMenuItem>
          <ContextMenuSeparator />
        </template>
        <ContextMenuItem @click="ctx.startRename(node.type, node.id, node.title)">
          <Icon name="lucide:pencil" class="size-3.5 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          class="text-destructive focus:text-destructive"
          @click="isFolder ? ctx.deleteFolder(node.id) : ctx.deleteAsset(node.id)"
        >
          <Icon name="lucide:trash-2" class="size-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>

    <!-- Children (folders only) -->
    <template v-if="isFolder && isExpanded && (node as FolderNode).children?.length">
      <FolderTreeNode
        v-for="child in (node as FolderNode).children"
        :key="child.id"
        :node="child"
        :level="level + 1"
      />
    </template>
  </div>
</template>
