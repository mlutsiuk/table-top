<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { cn } from '@/lib/utils'

const props = defineProps<{ editor: Editor }>()

type ToolbarItem =
  | { type: 'button'; icon: string; title: string; action: () => void; active: () => boolean }
  | { type: 'separator' }

const items = computed<ToolbarItem[]>(() => [
  {
    type: 'button',
    icon: 'lucide:bold',
    title: 'Bold',
    action: () => props.editor.chain().focus().toggleBold().run(),
    active: () => props.editor.isActive('bold'),
  },
  {
    type: 'button',
    icon: 'lucide:italic',
    title: 'Italic',
    action: () => props.editor.chain().focus().toggleItalic().run(),
    active: () => props.editor.isActive('italic'),
  },
  {
    type: 'button',
    icon: 'lucide:strikethrough',
    title: 'Strikethrough',
    action: () => props.editor.chain().focus().toggleStrike().run(),
    active: () => props.editor.isActive('strike'),
  },
  { type: 'separator' },
  {
    type: 'button',
    icon: 'lucide:heading-2',
    title: 'Heading 2',
    action: () => props.editor.chain().focus().toggleHeading({ level: 2 }).run(),
    active: () => props.editor.isActive('heading', { level: 2 }),
  },
  {
    type: 'button',
    icon: 'lucide:heading-3',
    title: 'Heading 3',
    action: () => props.editor.chain().focus().toggleHeading({ level: 3 }).run(),
    active: () => props.editor.isActive('heading', { level: 3 }),
  },
  { type: 'separator' },
  {
    type: 'button',
    icon: 'lucide:list',
    title: 'Bullet list',
    action: () => props.editor.chain().focus().toggleBulletList().run(),
    active: () => props.editor.isActive('bulletList'),
  },
  {
    type: 'button',
    icon: 'lucide:list-ordered',
    title: 'Ordered list',
    action: () => props.editor.chain().focus().toggleOrderedList().run(),
    active: () => props.editor.isActive('orderedList'),
  },
  { type: 'separator' },
  {
    type: 'button',
    icon: 'lucide:quote',
    title: 'Blockquote',
    action: () => props.editor.chain().focus().toggleBlockquote().run(),
    active: () => props.editor.isActive('blockquote'),
  },
  {
    type: 'button',
    icon: 'lucide:minus',
    title: 'Horizontal rule',
    action: () => props.editor.chain().focus().setHorizontalRule().run(),
    active: () => false,
  },
])
</script>

<template>
  <div class="flex flex-wrap items-center gap-0.5 border-b border-border bg-background px-2 py-1.5">
    <template v-for="(item, i) in items" :key="i">
      <div
        v-if="item.type === 'separator'"
        class="mx-0.5 h-5 w-px bg-border"
      />
      <button
        v-else
        :title="item.title"
        :class="cn(
          'inline-flex size-7 items-center justify-center rounded transition-colors',
          item.active()
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )"
        @click="item.action()"
      >
        <Icon :name="item.icon" class="size-4" />
      </button>
    </template>
  </div>
</template>
