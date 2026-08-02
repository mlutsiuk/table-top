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
