import type { MaterialVisibility } from '@prisma/client'
import type { MaterialAbility } from '#shared/permissions/material'

/**
 * Who is looking, reduced to the two facts the rules need. Resolved once per
 * request from the campaign standing, then answered offline.
 */
export type MaterialViewer = {
  canReadMaterials: boolean
  canWriteMaterials: boolean
}

type FolderRow = { id: string, path: string[], visibility: MaterialVisibility }

/**
 * Folders a viewer must not see, including everything beneath them.
 *
 * This is the part a role cannot answer on its own: `master_only` is inherited, so
 * a public folder nested under a hidden one is hidden too. Computed by intersecting
 * each folder's ancestry with the set of hidden ids — one pass over the tree, no
 * query per node, which is what keeps this usable for a tree of any size.
 *
 * Someone who may write material sees everything: hiding is aimed at players.
 */
export function hiddenFolderIds(folders: FolderRow[], viewer: MaterialViewer): Set<string> {
  if (viewer.canWriteMaterials) return new Set()

  const hiddenRoots = new Set(
    folders.filter(folder => folder.visibility === 'master_only').map(folder => folder.id)
  )
  if (hiddenRoots.size === 0) return new Set()

  const hidden = new Set<string>()
  for (const folder of folders) {
    // Self-inclusive paths mean a hidden folder matches its own id here too.
    if (folder.path.some(ancestorId => hiddenRoots.has(ancestorId))) {
      hidden.add(folder.id)
    }
  }

  return hidden
}

/** What the viewer may do to one node they can already see. */
export function materialAbilities(viewer: MaterialViewer): MaterialAbility[] {
  const abilities: MaterialAbility[] = []

  if (viewer.canReadMaterials) abilities.push('material:read')
  if (viewer.canWriteMaterials) abilities.push('material:write')

  return abilities
}
