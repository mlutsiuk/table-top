<script lang="ts" setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import Document from '@tiptap/extension-document'
import Text from '@tiptap/extension-text'
import Paragraph from '@tiptap/extension-paragraph'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Blockquote from '@tiptap/extension-blockquote'
import HardBreak from '@tiptap/extension-hard-break'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Dropcursor from '@tiptap/extension-dropcursor'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const DocumentWithTitle = Document.extend({
  content: 'title block+',
})

const Title = Heading.extend({
  name: 'title',
  group: 'title',
  parseHTML: () => [{ tag: 'h1:first-child' }],
}).configure({ levels: [1] })

let updatingFromProp = false

const editor = useEditor({
  content: props.modelValue ?? undefined,
  extensions: [
    DocumentWithTitle,
    Title,
    Heading.configure({ levels: [2, 3, 4] }),
    Text,
    Paragraph,
    BulletList,
    OrderedList,
    ListItem,
    Bold,
    Italic,
    Strike,
    Blockquote,
    HardBreak,
    HorizontalRule,
    Dropcursor,
    Placeholder.configure({
      showOnlyCurrent: false,
      placeholder: ({ node }) => {
        if (node.type.name === 'title') return "What's the title?"
        return "What's the story?"
      },
    }),
  ],
  onUpdate: ({ editor }) => {
    if (!updatingFromProp) {
      emit('update:modelValue', editor.getJSON())
    }
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (!val || !editor.value || editor.value.isDestroyed) return
    const current = JSON.stringify(editor.value.getJSON())
    const incoming = JSON.stringify(val)
    if (current !== incoming) {
      updatingFromProp = true
      editor.value.commands.setContent(val)
      updatingFromProp = false
    }
  },
)

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="flex flex-col min-h-0">
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
