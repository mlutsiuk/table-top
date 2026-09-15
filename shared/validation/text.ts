import { z } from 'zod'

// Every character class below is written with escapes, and this file must stay
// pure ASCII: a raw control or invisible character here would be exactly what the
// module exists to remove, and invisible to whoever reviews it.

/**
 * Line and paragraph breaks and tabs. In a single line they mean "a gap", so they
 * become a space: a pasted "Health" and "Points" on two lines should read as
 * "Health Points", not "HealthPoints".
 */
const BREAKS = /[\t\n\v\f\r\x85\u{2028}\u{2029}]/gu

/**
 * Every other C0 and C1 control character, NUL included.
 *
 * Postgres refuses NUL in text and in JSONB, so letting one through surfaced as a
 * 500 instead of a message. None of the rest has a visible meaning in a name.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROLS = /[\x00-\x1F\x7F-\x9F]/gu

/**
 * Characters that change nothing a reader can see, or change the order they see it
 * in: soft hyphen, zero-width space, word joiner, invisible math operators, BOM, the
 * Mongolian vowel separator, and the bidi marks, embeddings, overrides and isolates.
 *
 * Deliberately not here: the zero-width joiner and non-joiner and the variation
 * selectors. Emoji sequences and some scripts need them, and a string made only of
 * them still fails the visible-character check below.
 */
const INVISIBLE = /[\xAD\u{180E}\u{200B}\u{200E}\u{200F}\u{202A}-\u{202E}\u{2060}-\u{2064}\u{2066}-\u{2069}\u{FEFF}]/gu

/** A letter, digit, punctuation mark or symbol, which includes emoji. */
const VISIBLE = /[\p{L}\p{N}\p{P}\p{S}]/u

/**
 * One line of text as a person meant it.
 *
 * NFC rather than NFKC on purpose: NFKC would change what the master sees, turning
 * a superscript two into a plain 2. Keys, which nobody reads as prose, use NFKC.
 */
export function sanitizeLine(input: string): string {
  return input
    .normalize('NFC')
    .replace(BREAKS, ' ')
    .replace(CONTROLS, '')
    .replace(INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A single-line text input, cleaned before it is checked.
 *
 * The order matters: the length limit and the emptiness check run on what is
 * actually stored, so a name of only invisible characters is empty, and invisible
 * padding cannot push a name past the limit or make two identical names distinct.
 */
export function lineSchema(max: number, options: { allowEmpty?: boolean } = {}) {
  const checked = z.string().max(max, `At most ${max} characters`)

  return z.string()
    .transform(sanitizeLine)
    .pipe(options.allowEmpty
      ? checked
      : checked.refine(value => VISIBLE.test(value), { message: 'Cannot be empty' }))
}
