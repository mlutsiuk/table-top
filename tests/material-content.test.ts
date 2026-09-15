import { describe, expect, it } from 'vitest'
import { MAX_CONTENT_BYTES, parseMaterialContent } from '~~/server/features/assets/material-content'
import { BadRequestError } from '~~/server/infrastructure/errors'

// Pure ASCII: every control character below is written as an escape.

const title = (text: string) => ({ type: 'title', attrs: { level: 1 }, content: [{ type: 'text', text }] })
const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content })
const text = (value: string, marks?: unknown[]) => ({ type: 'text', text: value, ...(marks ? { marks } : {}) })
const doc = (...content: unknown[]) => ({ type: 'doc', content })

function refusal(content: unknown): string {
  try {
    parseMaterialContent(content)
  }
  catch (error) {
    // A domain error, so the client gets a 400 with this message rather than a 500.
    expect(error).toBeInstanceOf(BadRequestError)
    return (error as Error).message
  }
  throw new Error('expected the document to be refused')
}

describe('material content', () => {
  it('accepts a document the editor produces', () => {
    const content = doc(title('Goblin'), paragraph(text('Small and ', [{ type: 'bold' }]), text('mean')))
    expect(parseMaterialContent(content)).toEqual(content)
  })

  it('stores the canonical form, filling in what the schema defaults', () => {
    const stored = parseMaterialContent(doc({ type: 'title', content: [text('Goblin')] }, paragraph()))
    expect((stored.content as { attrs?: unknown }[])[0]!.attrs).toEqual({ level: 1 })
  })

  it('strips NUL instead of letting Postgres refuse the document', () => {
    const stored = parseMaterialContent(doc(title('Gob\x00lin'), paragraph()))
    expect(JSON.stringify(stored)).not.toContain('\\u0000')
    expect((stored.content as { content: { text: string }[] }[])[0]!.content[0]!.text).toBe('Goblin')
  })

  it('drops a text node that stripping leaves empty', () => {
    const stored = parseMaterialContent(doc(title('Goblin'), paragraph(text('\x00\x07'))))
    expect(stored.content).toEqual([title('Goblin'), { type: 'paragraph' }])
  })

  it('refuses a node the editor cannot produce', () => {
    expect(refusal(doc(title('Goblin'), { type: 'iframe' }))).toContain('iframe')
  })

  it('refuses a mark the editor cannot produce', () => {
    // No link extension, so no stored href to ever carry a javascript: URL.
    expect(refusal(doc(title('Goblin'), paragraph(text('x', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]))))).toContain('link')
  })

  it('refuses a document without its title', () => {
    expect(refusal(doc(paragraph(text('No title'))))).toContain('does not match the editor')
  })

  it('refuses something that is not a document at all', () => {
    for (const content of [null, 'text', 42, []]) {
      refusal(content)
    }
  })

  it('refuses a document over the size limit', () => {
    const big = doc(title('Goblin'), paragraph(text('x'.repeat(MAX_CONTENT_BYTES))))
    expect(refusal(big)).toContain('too large')
  })

  it('refuses pathological nesting before it can overflow the stack', () => {
    let node: Record<string, unknown> = paragraph(text('deep'))
    for (let level = 0; level < 5000; level++)
      node = { type: 'blockquote', content: [node] }

    expect(refusal(doc(title('Goblin'), node))).toContain('nested too deeply')
  })
})
