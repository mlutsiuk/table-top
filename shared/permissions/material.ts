/**
 * What can be done to one folder or asset.
 *
 * A separate union from `CampaignAbility` on purpose: `canOn` infers the allowed
 * set from the subject, so passing a folder offers these and rejects a
 * campaign-level ability at compile time.
 *
 * Campaign-level `materials:write` answers "may I edit material here at all";
 * these answer "may I edit *this* one", which the role alone cannot decide.
 */
export const MATERIAL_ABILITIES = [
  'material:read',
  'material:write'
] as const

export type MaterialAbility = typeof MATERIAL_ABILITIES[number]

/**
 * Visibility values, mirroring the `MaterialVisibility` enum in the schema.
 * Shared so the API schema and the UI both spell them the same way.
 */
export const MATERIAL_VISIBILITIES = ['public', 'master_only'] as const

export type MaterialVisibilityValue = typeof MATERIAL_VISIBILITIES[number]
