<script lang="ts" setup>
import { Editor, EditorContent } from '@tiptap/vue-3'
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

const DocumentWithTitle = Document.extend({
  content: "title block+",
})

const Title = Heading.extend({
  name: "title",
  group: "title",
  parseHTML: () => [{ tag: "h1:first-child" }],
}).configure({ levels: [1] });

const editor = new Editor({
  extensions: [
    DocumentWithTitle,
    Title,
    Heading,
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
        if (node.type.name === "title") {
          return "What's the title?";
        }

        return "What's the story?";
      },
    }),
  ]
})
</script>

<template>
  <EditorContent class="prose dark:prose-invert max-w-none" :editor="editor" />
</template>

<style>
.ProseMirror h1.is-empty:nth-child(1)::before,
.ProseMirror p.is-empty:nth-child(2):last-child::before {
  opacity: 0.5;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.ProseMirror:focus {
  outline: none;
}
</style>
