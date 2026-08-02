import type { MaterialVisibility, PrismaClient } from '@prisma/client'
import type { CampaignAccessService } from '~~/server/features/campaigns/services/campaign-access.service'
import { NotFoundError } from '~~/server/infrastructure/errors'

export function createAssetsService(prisma: PrismaClient, access: CampaignAccessService) {
  /** Readable by players too — for now they see the same materials as the master. */
  async function getById(id: string) {
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) throw new NotFoundError('Asset not found')

    await access.requireAbility(asset.campaignId, 'materials:read')

    return asset
  }

  async function create(folderId: string, title: string) {
    const folder = await access.requireFolderAbility(folderId, 'materials:write')

    return prisma.asset.create({
      data: {
        title,
        // Taken from the verified folder — never from the client, or an asset
        // could be planted into a campaign the caller does not own.
        campaignId: folder.campaignId,
        folderId: folder.id
      }
    })
  }

  async function rename(id: string, title: string) {
    const asset = await access.requireAssetAbility(id, 'materials:write')

    return prisma.asset.update({ where: { id: asset.id }, data: { title } })
  }

  async function saveContent(id: string, content: unknown) {
    const asset = await access.requireAssetAbility(id, 'materials:write')

    return prisma.asset.update({
      where: { id: asset.id },
      data: { content: content as never }
    })
  }

  async function remove(id: string) {
    const asset = await access.requireAssetAbility(id, 'materials:write')

    await prisma.asset.delete({ where: { id: asset.id } })
  }

  async function move(id: string, folderId: string) {
    const asset = await access.requireAssetAbility(id, 'materials:write')

    // The destination needs checking too, otherwise an asset could be moved into
    // a folder of another campaign — or another user's campaign entirely.
    const target = await prisma.folder.findFirst({
      where: { id: folderId, campaignId: asset.campaignId },
      select: { id: true }
    })
    if (!target) throw new NotFoundError('Target folder not found')

    return prisma.asset.update({
      where: { id: asset.id },
      data: { folderId: target.id }
    })
  }

  /** Master-only keeps the asset out of a player's tree entirely. */
  async function setVisibility(id: string, visibility: MaterialVisibility) {
    const asset = await access.requireAssetAbility(id, 'materials:write')

    return prisma.asset.update({ where: { id: asset.id }, data: { visibility } })
  }

  return { getById, create, rename, saveContent, remove, move, setVisibility }
}

export type AssetsService = ReturnType<typeof createAssetsService>
