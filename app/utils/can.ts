import type { CampaignAbility } from '#shared/permissions/campaign'
import { hasAbility } from '#shared/permissions/campaign'

/**
 * Anything the server resolved abilities for. `A` is that subject's own ability
 * union, so a folder and a campaign cannot be checked against each other's rules.
 */
type AbilityHolder<A extends string> = { abilities: readonly A[] }

/**
 * May I do this in the campaign I am currently in?
 *
 * For actions that belong to the campaign as a whole rather than to any one thing
 * in it — editing settings, managing players, creating material at all. Autocomplete
 * offers exactly the campaign-level abilities, because there is no subject to
 * narrow it further.
 *
 * Fails closed: with no campaign loaded there are no abilities.
 */
export function can(ability: CampaignAbility): boolean {
  return hasAbility(useCampaignStore().campaign?.abilities ?? [], ability)
}

/**
 * May I do this to this particular thing?
 *
 * The ability union is inferred from the subject, so passing a folder offers only
 * the folder's abilities and rejects a campaign-level one at compile time. That is
 * the whole reason this is separate from `can`: the question is a different shape,
 * and so is the set of valid answers.
 *
 * Useful wherever several subjects are on screen at once — the campaign list — and
 * it is how per-resource rules will arrive: once a folder carries `abilities`, this
 * works on it with no change here.
 */
export function canOn<A extends string>(
  subject: AbilityHolder<A> | null | undefined,
  // `NoInfer` matters: without it the union is inferred from this argument too, so
  // any ability would be accepted by widening `A` to include it.
  ability: NoInfer<A>
): boolean {
  return hasAbility(subject?.abilities ?? [], ability)
}
