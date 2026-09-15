import { z } from 'zod'

/**
 * The shape every address segment has: a trait definition key and a field key alike.
 *
 * Both halves of `@core_stats.str` go through this, so they cannot drift apart.
 * Deliberately strict, because loosening a key format later is far easier than
 * tightening one that formulas already rely on.
 */
export const identifierSchema = z.string()
  .min(1)
  .max(40)
  .regex(/^[a-z][a-z0-9_]*$/, 'Lowercase letters, digits and underscores, starting with a letter')

/**
 * Keys a trait definition may not take.
 *
 * `#target` and `@target` cannot collide, since the symbols differ (ADR-016). These
 * are held back anyway, so a formula never reads as if it meant the other one.
 */
export const RESERVED_TRAIT_KEYS = ['self', 'target', 'targets', 'source', 'owner', 'parent'] as const

export const traitKeySchema = identifierSchema.refine(
  key => !(RESERVED_TRAIT_KEYS as readonly string[]).includes(key),
  { message: 'This name is reserved' }
)

/**
 * Cyrillic to Latin, after the 2010 Ukrainian national table, without the special
 * word-initial forms: a key is a machine name, not a passport spelling.
 *
 * The few Russian-only letters are covered too, so a label typed in either does
 * not silently lose characters.
 */
const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'iu',
  я: 'ia',
  ы: 'y',
  э: 'e',
  ё: 'e',
  ъ: ''
}

/** Apostrophes vanish rather than turning into a separator: `здоров'я` is one word. */
const APOSTROPHES = /['’ʼ]/g

/**
 * A key suggested from what the master typed as the label.
 *
 * Only a suggestion: the master can edit it before saving. Returns an empty string
 * when nothing usable is left, so the form asks for a key instead of inventing one.
 */
export function deriveTraitKey(label: string): string {
  const latin = [...label.toLowerCase().replace(APOSTROPHES, '')]
    .map(char => TRANSLIT[char] ?? char)
    .join('')

  const key = latin
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
    .replace(/_+$/, '')

  return /^[a-z]/.test(key) ? key : ''
}
