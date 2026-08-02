import type { CampaignRole } from '#shared/types/campaign'

/**
 * What can be done inside a campaign, named once for both sides.
 *
 * The client checks these strings to decide what to render; the server checks the
 * same strings before it writes. Grepping an ability turns up the button and the
 * procedure that guards it together — which is not possible when one side talks
 * about roles and the other about `requireMaster`.
 */
export const CAMPAIGN_ABILITIES = [
  'campaign:read',
  'campaign:update',
  'members:read',
  'members:manage',
  'materials:read',
  'materials:write'
] as const

export type CampaignAbility = typeof CAMPAIGN_ABILITIES[number]

/**
 * Written as ability → roles rather than role → abilities on purpose: typed as
 * `Record<CampaignAbility, …>`, adding an ability without deciding who gets it
 * becomes a compile error rather than a silently missing permission.
 *
 * Annotated rather than `satisfies`, which would narrow each entry to its own
 * literal tuple and refuse a lookup by a general `CampaignRole`.
 */
const ABILITY_ROLES: Record<CampaignAbility, readonly CampaignRole[]> = {
  'campaign:read': ['master', 'player'],
  'campaign:update': ['master'],
  'members:read': ['master', 'player'],
  'members:manage': ['master'],
  'materials:read': ['master', 'player'],
  'materials:write': ['master']
}

/** Everything a role may do, in a stable order. */
export function abilitiesFor(role: CampaignRole): CampaignAbility[] {
  return CAMPAIGN_ABILITIES.filter(ability => ABILITY_ROLES[ability].includes(role))
}

/**
 * Whether a resolved set of abilities contains one.
 *
 * Takes the set rather than the role because the server is the only evaluator:
 * once rules stop being a pure function of the role, the list still arrives
 * ready-made. Generic over the ability union so each kind of subject keeps its
 * own — a folder's abilities are not a campaign's.
 */
export function hasAbility<A extends string>(
  abilities: readonly A[],
  ability: A
): boolean {
  return abilities.includes(ability)
}
