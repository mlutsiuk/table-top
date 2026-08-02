import type { MaterialVisibility, PrismaClient } from '@prisma/client'
import type { CampaignAccessService } from '~~/server/features/campaigns/services/campaign-access.service'
import { BadRequestError, NotFoundError } from '~~/server/infrastructure/errors'
import { hasAbility } from '#shared/permissions/campaign'
import { canMoveUnder, childPath, reparentedPath } from '../domain/folder-path'
import type { MaterialViewer } from '../domain/material-visibility'
import { hiddenFolderIds, materialAbilities } from '../domain/material-visibility'

export function createFoldersService(prisma: PrismaClient, access: CampaignAccessService) {
  /**
   * The tree as this caller is allowed to see it.
   *
   * Two things happen here that a role check cannot do on its own: nodes marked
   * master-only are dropped along with everything beneath them, and each surviving
   * node carries the abilities the caller holds over it. Both are resolved in one
   * pass in memory — the alternative, asking the database per node, does not scale
   * past a small tree.
   */
  async function getTree(campaignId: string) {
    const { abilities } = await access.requireAbility(campaignId, 'materials:read')

    const viewer: MaterialViewer = {
      canReadMaterials: hasAbility(abilities, 'materials:read'),
      canWriteMaterials: hasAbility(abilities, 'materials:write')
    }

    const [folderRows, assetRows] = await Promise.all([
      prisma.folder.findMany({
        where: { campaignId },
        // `path` is fetched but never sent: it is a denormalisation of `parentId`,
        // used here to resolve inherited visibility and nothing else.
        select: { id: true, title: true, parentId: true, path: true, visibility: true }
      }),
      prisma.asset.findMany({
        where: { campaignId },
        select: { id: true, title: true, folderId: true, visibility: true }
      })
    ])

    const hidden = hiddenFolderIds(folderRows, viewer)
    const nodeAbilities = materialAbilities(viewer)

    const folders = folderRows
      .filter(folder => !hidden.has(folder.id))
      .map(folder => ({
        id: folder.id,
        title: folder.title,
        parentId: folder.parentId,
        visibility: folder.visibility,
        abilities: nodeAbilities
      }))

    const assets = assetRows
      .filter(asset => !hidden.has(asset.folderId))
      .filter(asset => viewer.canWriteMaterials || asset.visibility === 'public')
      .map(asset => ({
        id: asset.id,
        title: asset.title,
        folderId: asset.folderId,
        visibility: asset.visibility,
        abilities: nodeAbilities
      }))

    return { folders, assets }
  }

  /** Master-only hides the folder and its whole subtree from players. */
  async function setFolderVisibility(id: string, visibility: MaterialVisibility) {
    const folder = await access.requireFolderAbility(id, 'materials:write')

    return prisma.folder.update({ where: { id: folder.id }, data: { visibility } })
  }

  async function create(input: { campaignId: string, parentId?: string, title: string }) {
    await access.requireAbility(input.campaignId, 'materials:write')

    let parentPath: string[] = []

    if (input.parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: input.parentId, campaignId: input.campaignId },
        select: { path: true }
      })
      if (!parent) throw new NotFoundError('Parent folder not found')

      parentPath = parent.path
    }

    // Generated here rather than by the column default: the path has to end with
    // this id, and both are written in the same insert.
    const id = crypto.randomUUID()

    return prisma.folder.create({
      data: {
        id,
        title: input.title,
        campaignId: input.campaignId,
        parentId: input.parentId ?? null,
        path: childPath(parentPath, id)
      }
    })
  }

  async function rename(id: string, title: string) {
    const folder = await access.requireFolderAbility(id, 'materials:write')

    return prisma.folder.update({ where: { id: folder.id }, data: { title } })
  }

  async function remove(id: string) {
    const folder = await access.requireFolderAbility(id, 'materials:write')

    // Subfolders and assets go with it through the cascades on the schema,
    // in a single statement rather than a query per node.
    await prisma.folder.delete({ where: { id: folder.id } })
  }

  async function move(id: string, parentId: string | null) {
    const folder = await access.requireFolderAbility(id, 'materials:write')

    let newParentPath: string[] = []

    if (parentId) {
      // The destination must belong to the same campaign, otherwise a folder
      // could be reparented into someone else's tree.
      const target = await prisma.folder.findFirst({
        where: { id: parentId, campaignId: folder.campaignId },
        select: { path: true }
      })
      if (!target) throw new NotFoundError('Target folder not found')

      if (!canMoveUnder(folder.id, target.path)) {
        throw new BadRequestError('Cannot move a folder into its own subtree')
      }

      newParentPath = target.path
    }

    const { path, suffixStart } = reparentedPath(newParentPath, folder.id, folder.path)

    await prisma.$transaction([
      prisma.folder.update({ where: { id: folder.id }, data: { parentId } }),
      // Rewrites this folder and every descendant in one statement: swap the old
      // prefix for the new one, keep whatever hung below it.
      prisma.$executeRaw`
        UPDATE "folders"
        SET "path" = ${path}::text[] || "path"[${suffixStart}:]
        WHERE "campaign_id" = ${folder.campaignId}
          AND "path" @> ARRAY[${folder.id}]::text[]
      `
    ])

    return prisma.folder.findUniqueOrThrow({ where: { id: folder.id } })
  }

  return {
    getTree,
    create,
    rename,
    remove,
    move,
    setFolderVisibility
  }
}

export type FoldersService = ReturnType<typeof createFoldersService>
