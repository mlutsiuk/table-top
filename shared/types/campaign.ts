/**
 * The caller's standing in a campaign.
 *
 * Derived, never stored: the master is `Campaign.masterId` and everyone with a
 * `CampaignMember` row is a player. Keeping it out of the database means a
 * second, contradictory master cannot be represented.
 */
export type CampaignRole = 'master' | 'player'
