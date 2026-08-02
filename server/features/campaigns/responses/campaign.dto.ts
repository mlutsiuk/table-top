import type { Campaign } from '@prisma/client'
import type { CampaignDto, CampaignRole } from '#shared/types/campaign'
import { abilitiesFor } from '#shared/permissions/campaign'

/**
 * Trims a campaign row down to what the API exposes. Keeping this in one place is
 * what stops `masterId` — and any column added later — from leaking by default.
 *
 * Abilities are resolved here rather than on the client: one evaluator, so the two
 * sides cannot disagree about what the caller may do.
 */
export function toCampaignDto(campaign: Campaign, role: CampaignRole): CampaignDto {
  return {
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    createdAt: campaign.createdAt,
    role,
    abilities: abilitiesFor(role)
  }
}
