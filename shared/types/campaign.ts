import type { CampaignAbility } from '#shared/permissions/campaign'

/**
 * The caller's standing in a campaign.
 *
 * Derived, never stored: the master is `Campaign.masterId` and everyone with a
 * `CampaignMember` row is a player. Keeping it out of the database means a
 * second, contradictory master cannot be represented.
 */
export type CampaignRole = 'master' | 'player'

/**
 * Lifecycle of a campaign. Mirrors the `CampaignStatus` enum in the schema, and is
 * declared here so the client never has to reach into `@prisma/client` for it.
 */
export const CAMPAIGN_STATUSES = ['draft', 'active', 'archived'] as const

export type CampaignStatus = typeof CAMPAIGN_STATUSES[number]

/** A participant as the API exposes them — never the raw `User` row. */
export type CampaignMemberDto = {
  id: string
  name: string
  email: string
  role: CampaignRole
}

/**
 * A campaign as the API exposes it — never the raw `Campaign` row.
 *
 * `masterId` deliberately stays server-side: the client only ever needs to know
 * its own standing, which travels as `role`.
 */
export type CampaignDto = {
  id: string
  title: string
  status: CampaignStatus
  createdAt: Date
  role: CampaignRole
  /**
   * Resolved server-side and shipped ready-made, rather than derived from `role`
   * on the client. Keeps a single evaluator for the day rules stop depending on
   * the role alone — two evaluators would inevitably drift apart.
   */
  abilities: CampaignAbility[]
}
