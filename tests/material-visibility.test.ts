import { describe, expect, it } from 'vitest'
import { hiddenFolderIds, materialAbilities } from '~~/server/features/folders/domain/material-visibility'

const master = { canReadMaterials: true, canWriteMaterials: true }
const player = { canReadMaterials: true, canWriteMaterials: false }

/**
 * root
 * ├── secret        (master_only)
 * │   └── deep      (public, but inherits hidden)
 * └── open          (public)
 */
const folders = [
  { id: 'root', path: ['root'], visibility: 'public' as const },
  { id: 'secret', path: ['root', 'secret'], visibility: 'master_only' as const },
  { id: 'deep', path: ['root', 'secret', 'deep'], visibility: 'public' as const },
  { id: 'open', path: ['root', 'open'], visibility: 'public' as const }
]

describe('hiddenFolderIds', () => {
  it('hides nothing from someone who may write materials', () => {
    expect(hiddenFolderIds(folders, master).size).toBe(0)
  })

  it('hides a master-only folder from a player', () => {
    expect(hiddenFolderIds(folders, player).has('secret')).toBe(true)
  })

  it('hides a public folder nested under a master-only one', () => {
    // The point of the rule: visibility is inherited, so `deep` being public
    // is not enough to make it visible.
    expect(hiddenFolderIds(folders, player).has('deep')).toBe(true)
  })

  it('leaves siblings of a hidden folder alone', () => {
    const hidden = hiddenFolderIds(folders, player)
    expect(hidden.has('open')).toBe(false)
    expect(hidden.has('root')).toBe(false)
  })

  it('hides nothing when no folder is marked', () => {
    const allPublic = folders.map(f => ({ ...f, visibility: 'public' as const }))
    expect(hiddenFolderIds(allPublic, player).size).toBe(0)
  })

  it('hides a whole tree when the root is marked', () => {
    const hiddenRoot = folders.map(f =>
      f.id === 'root' ? { ...f, visibility: 'master_only' as const } : f
    )
    expect(hiddenFolderIds(hiddenRoot, player).size).toBe(folders.length)
  })
})

describe('materialAbilities', () => {
  it('gives a master read and write', () => {
    expect(materialAbilities(master)).toEqual(['material:read', 'material:write'])
  })

  it('gives a player read only', () => {
    expect(materialAbilities(player)).toEqual(['material:read'])
  })

  it('gives nothing to someone who may not even read', () => {
    expect(materialAbilities({ canReadMaterials: false, canWriteMaterials: false })).toEqual([])
  })
})
