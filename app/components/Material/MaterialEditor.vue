<script lang="ts" setup>
import Dropcursor from '@tiptap/extension-dropcursor'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { materialExtensions } from '#shared/editor/extensions'

const props = defineProps<{
  modelValue?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'update:title', value: string): void
}>()

let updatingFromProp = false

const editor = useEditor({
  content: props.modelValue ?? undefined,
  extensions: [
    // The schema itself is shared with the server, which checks saved documents
    // against it; only editing aids are added here.
    ...materialExtensions,
    Dropcursor,
    Placeholder.configure({
      showOnlyCurrent: false,
      placeholder: ({ node }) => {
        if (node.type.name === 'title')
          return 'What\'s the title?'
        return 'What\'s the story?'
      }
    })
  ],
  onUpdate: ({ editor }) => {
    if (updatingFromProp)
      return
    emit('update:modelValue', editor.getJSON())
    const titleText = editor.state.doc.firstChild?.textContent ?? ''
    emit('update:title', titleText)
  }
})

watch(
  () => props.modelValue,
  (val) => {
    if (!val || !editor.value || editor.value.isDestroyed)
      return
    const current = JSON.stringify(editor.value.getJSON())
    const incoming = JSON.stringify(val)
    if (current !== incoming) {
      updatingFromProp = true
      editor.value.commands.setContent(val)
      updatingFromProp = false
    }
  }
)

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <MaterialEditorToolbar
      v-if="editor"
      :editor="editor"
      class="sticky top-0 z-10 shrink-0"
    />
    <EditorContent
      class="prose dark:prose-invert max-w-none flex-1 overflow-y-auto px-8 py-6"
      :editor="editor"
    />
  </div>
</template>

<style>
.ProseMirror h1.is-empty:nth-child(1)::before,
.ProseMirror p.is-empty:nth-child(2):last-child::before {
  color: var(--muted-foreground);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.ProseMirror:focus {
  outline: none;
}
</style>
