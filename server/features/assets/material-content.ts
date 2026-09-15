import { getSchema } from '@tiptap/core'
import { BadRequestError } from '~~/server/infrastructure/errors'
import { materialExtensions } from '#shared/editor/extensions'

// This file must stay pure ASCII: escapes only, no raw control characters.

/** Far beyond a long wiki page, which weighs tens of kilobytes as JSON. */
export const MAX_CONTENT_BYTES = 512 * 1024

/**
 * JSON nesting, counting arrays and objects alike, so roughly twice the node depth.
 *
 * Real documents stay within a couple of dozen; the limit exists so pathological
 * input is refused before it reaches recursive code, instead of overflowing the
 * stack and surfacing as a 500.
 */
const MAX_DEPTH = 100

/**
 * Control characters, tab and newline excepted.
 *
 * Postgres refuses NUL in JSONB, so a document carrying one used to fail as a 500.
 * Unlike names, prose keeps its invisible characters: bidi marks and joiners can be
 * legitimate in running text, and nothing here compares documents for uniqueness.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROLS = /[\x00-\x08\x0B-\x1F\x7F-\x9F]/gu

const schema = getSchema(materialExtensions)

function isEmptyTextNode(value: unknown): boolean {
  return typeof value === 'object'
    && value !== null
    && (value as { type?: unknown }).type === 'text'
    && (value as { text?: unknown }).text === ''
}

/** A copy of the input with control characters removed from every string. */
function clean(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH)
    throw new BadRequestError('The document is nested too deeply')

  if (typeof value === 'string')
    return value.replace(CONTROLS, '')

  if (Array.isArray(value)) {
    return value
      .map(item => clean(item, depth + 1))
      // Removing characters can empty a text node, which ProseMirror refuses. An
      // empty one carried nothing, so dropping it keeps an honest document valid.
      .filter(item => !isEmptyTextNode(item))
  }

  if (typeof value === 'object' && value !== null)
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item, depth + 1)]))

  return value
}

/**
 * A material document as it may be stored, or a refusal the client can show.
 *
 * Checked against the editor's own schema, so an unknown node or mark, a missing
 * title or a malformed tree never reaches the database. What is stored is the
 * canonical form ProseMirror produces, not whatever shape the request happened to
 * send.
 */
export function parseMaterialContent(content: unknown): Record<string, unknown> {
  const cleaned = clean(content, 0)

  const bytes = new TextEncoder().encode(JSON.stringify(cleaned) ?? '').length
  if (bytes > MAX_CONTENT_BYTES) {
    throw new BadRequestError(
      `The document is too large: ${Math.ceil(bytes / 1024)} KB, at most ${MAX_CONTENT_BYTES / 1024} KB`
    )
  }

  try {
    const node = schema.nodeFromJSON(cleaned)
    node.check()

    return node.toJSON()
  }
  catch (error) {
    // ProseMirror names the problem precisely, e.g. "Unknown node type: iframe".
    const reason = error instanceof Error ? error.message : 'invalid content'
    throw new BadRequestError(`The document does not match the editor: ${reason}`)
  }
}
