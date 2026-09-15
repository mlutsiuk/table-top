import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * `engine/` sits outside `app/` and `server/`, so the bundler does not police it.
 * These tests do instead.
 *
 * Engine code is imported by both sides, so it may depend on neither: a Vue import
 * would break the Nitro build, a Prisma import would break the client one, and
 * either could sit unnoticed until deploy. UI belongs in `app/`.
 */

const ENGINE = fileURLToPath(new URL('../engine', import.meta.url))

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)

    return statSync(full).isDirectory() ? filesUnder(full) : [full]
  })
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8')

  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]!)
}

const sources = filesUnder(ENGINE).filter(file => /\.(?:ts|vue)$/.test(file))

const forbidden: RegExp[] = [
  // The UI framework, and components of any kind.
  /^vue$/,
  /\.vue$/,
  // The database and the server runtime.
  /^@prisma\/client$/,
  /^h3$/,
  /^~~\/server/,
  // The app, whether through its aliases or Nuxt's virtual modules.
  /^@\//,
  /^~\//,
  /^~~\/app/,
  /^#app/,
  /^#imports/
]

describe('engine boundaries', () => {
  it('keeps the engine free of UI, database and app imports', () => {
    const offences = sources.flatMap(file =>
      importsOf(file)
        .filter(specifier => forbidden.some(pattern => pattern.test(specifier)))
        .map(specifier => `${file.replace(ENGINE, 'engine')} imports ${specifier}`)
    )

    expect(offences).toEqual([])
  })

  it('holds no components', () => {
    expect(sources.filter(file => file.endsWith('.vue'))).toEqual([])
  })

  it('actually reads the files it claims to check', () => {
    // Without this the suite would pass just as happily on an empty directory.
    expect(sources.length).toBeGreaterThan(0)
  })
})
