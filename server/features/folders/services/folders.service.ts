import type { PrismaClient } from '@prisma/client'
import type { CampaignAccessService } from '~~/server/features/campaigns/services/campaign-access.service'
import { BadRequestError, NotFoundError } from '~~/server/infrastructure/errors'
import { canMoveUnder, childPath, reparentedPath } from '../domain/folder-path'

export function createFoldersService(prisma: PrismaClient, access: CampaignAccessService) {
  /** Readable by players too — for now they see the same tree as the master. */
  async function getTree(campaignId: string) {
    await access.requireCampaign(campaignId)

    const [folders, assets] = await Promise.all([
      prisma.folder.findMany({
        where: { campaignId },
        // `path` stays server-side. It is a denormalisation of `parentId`, and the
        // client loads the whole tree at once — it can derive any ancestry it needs
        // from the structure it already builds.
        select: { id: true, title: true, parentId: true }
      }),
      prisma.asset.findMany({
        where: { campaignId },
        select: { id: true, title: true, folderId: true }
      })
    ])

    return { folders, assets }
  }

  async function create(input: { campaignId: string, parentId?: string, title: string }) {
    await access.requireMaster(input.campaignId)

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
    const folder = await access.requireWritableFolder(id)

    return prisma.folder.update({ where: { id: folder.id }, data: { title } })
  }

  async function remove(id: string) {
    const folder = await access.requireWritableFolder(id)

    // Subfolders and assets go with it through the cascades on the schema,
    // in a single statement rather than a query per node.
    await prisma.folder.delete({ where: { id: folder.id } })
  }

  async function move(id: string, parentId: string | null) {
    const folder = await access.requireWritableFolder(id)

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
    move
  }
}

export type FoldersService = ReturnType<typeof createFoldersService>
