import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * `engine/` sits outside `app/` and `server/`, so the bundler does not police it.
 * These tests do instead.
 *
 * The point is not tidiness: a Vue import under `server/` would break the Nitro
 * build, a Prisma import under `ui/` would break the client one, and either could
 * sit unnoticed until deploy.
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

/** Every engine file whose path contains the given audience folder. */
function audience(name: string) {
  return filesUnder(ENGINE).filter(file => file.includes(`/${name}/`))
}

const forbidden: Record<string, RegExp[]> = {
  // Shared code is imported by both sides, so it may depend on neither.
  shared: [/^vue$/, /^@prisma\/client$/, /^h3$/, /\.vue$/],
  // Server-only logic must never pull the UI framework into Nitro.
  server: [/^vue$/, /\.vue$/],
  // UI must never reach for the database or the server tree.
  ui: [/^@prisma\/client$/, /^h3$/, /~~\/server/]
}

describe('engine audience boundaries', () => {
  for (const [name, patterns] of Object.entries(forbidden)) {
    it(`keeps ${name}/ free of what it must not import`, () => {
      const offences = audience(name).flatMap(file =>
        importsOf(file)
          .filter(specifier => patterns.some(pattern => pattern.test(specifier)))
          .map(specifier => `${file.replace(ENGINE, 'engine')} imports ${specifier}`)
      )

      expect(offences).toEqual([])
    })
  }

  it('actually reads the files it claims to check', () => {
    // Without this the suite would pass just as happily on an empty directory.
    expect(audience('shared').length).toBeGreaterThan(0)
  })
})
