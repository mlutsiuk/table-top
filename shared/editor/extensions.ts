import Blockquote from '@tiptap/extension-blockquote'
import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import Document from '@tiptap/extension-document'
import HardBreak from '@tiptap/extension-hard-break'
import Heading from '@tiptap/extension-heading'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Italic from '@tiptap/extension-italic'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import Paragraph from '@tiptap/extension-paragraph'
import Strike from '@tiptap/extension-strike'
import Text from '@tiptap/extension-text'

/** A material document always opens with its title, which the asset title is read from. */
const DocumentWithTitle = Document.extend({
  content: 'title block+'
})

const Title = Heading.extend({
  name: 'title',
  group: 'title',
  parseHTML: () => [{ tag: 'h1:first-child' }]
}).configure({ levels: [1] })

/**
 * The extensions that decide what a material document may contain.
 *
 * Shared by the editor and the server so both hold one schema: a saved document is
 * checked against exactly what the editor could have produced, and adding a node
 * type here is the one change that makes it both editable and storable.
 *
 * Only schema-defining extensions belong here. Editing aids that leave no trace in
 * the document, like the placeholder or the drop cursor, stay in the component.
 */
export const materialExtensions = [
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
  HorizontalRule
]
