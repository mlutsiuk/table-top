import { defu } from 'defu'

/**
 * Generates initials from a given string (e.g., a full name).
 *
 * Splits the string by whitespace and takes the first character
 * of each word until the `maxLetters` limit is reached. Defaults to 2 letters.
 * Uses `defu` to merge provided options with defaults.
 *
 * @param {string} input - The input string (e.g., a person's name).
 * @param {object} [options] - Optional configuration.
 * @param {number} [options.maxLetters] - Maximum number of initials to return.
 * @returns {string} The generated initials in uppercase.
 *
 * @example
 * generateInitials("Alice Bob Charlie");
 * // "AB"
 *
 * @example
 * generateInitials("John Doe", { maxLetters: 1 });
 * // "J"
 *
 * @example
 * generateInitials("SingleName");
 * // "S"
 */
export function generateInitials(input: string, options?: { maxLetters?: number }) {
  const { maxLetters } = defu(options, { maxLetters: 2 })

  if (!input.trim())
    return ''

  const words = input.trim().split(/\s+/)
  const initials = words.map(word => word[0]?.toUpperCase() ?? '')

  return initials.slice(0, maxLetters).join('')
}