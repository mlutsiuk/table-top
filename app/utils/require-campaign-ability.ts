import type { RouteLocationNormalized } from 'vue-router'
import type { CampaignAbility } from '#shared/permissions/campaign'
import { hasAbility } from '#shared/permissions/campaign'

/**
 * Route guard for pages that only make sense to someone holding an ability.
 *
 * Waits for the campaign before deciding, because the ability list arrives with
 * it — guarding on a half-loaded store would bounce everyone on a hard refresh.
 *
 * Convenience only. Every action behind these pages is checked again server-side;
 * this just keeps people out of screens they cannot use.
 */
export function requireCampaignAbility(ability: CampaignAbility) {
  return async (to: RouteLocationNormalized) => {
    // Typed routes know that not every route has an `id`. This guard only means
    // something under `/campaigns/[id]`; anywhere else there is no campaign to check.
    if (!('id' in to.params)) {
      return navigateTo({ name: 'campaigns' })
    }

    const campaignStore = useCampaignStore()
    const campaignId = to.params.id

    await campaignStore.ensureCampaign(campaignId)

    if (!campaignStore.campaign) {
      return navigateTo({ name: 'campaigns' })
    }

    if (!hasAbility(campaignStore.campaign.abilities, ability)) {
      return navigateTo({ name: 'campaigns-id', params: { id: campaignId } })
    }
  }
}
