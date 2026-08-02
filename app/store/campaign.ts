import type { CampaignDto, CampaignStatus } from '#shared/types/campaign'

export const useCampaignStore = defineStore('campaign', () => {
  const campaign = ref<CampaignDto | null>(null)
  const treeVersion = ref(0)

  /**
   * For showing the role, not for gating actions — use the global `can()`
   * for that, so the client and the server check the same rule.
   */
  const isMaster = computed(() => campaign.value?.role === 'master')

  const fetchCampaign = async (campaignId: string) => {
    // Drop loaded
    if (campaign.value?.id !== campaignId) {
      campaign.value = null
    }

    try {
      const response = await useTrpc().campaign.getCampaignDetails.query({ campaignId })
      if (response) campaign.value = response
    } catch (e) {
      notifyError(e, 'Could not load the campaign')
    }
  }

  let inFlightId: string | null = null
  let inFlight: Promise<void> | null = null

  const ensureCampaign = (campaignId: string) => {
    if (campaign.value?.id === campaignId) return Promise.resolve()
    if (inFlight && inFlightId === campaignId) return inFlight

    inFlightId = campaignId
    inFlight = fetchCampaign(campaignId).finally(() => {
      if (inFlightId === campaignId) {
        inFlight = null
        inFlightId = null
      }
    })

    return inFlight
  }

  const updateCampaign = async (data: { title?: string, status?: CampaignStatus }) => {
    if (!campaign.value) return

    const previous = campaign.value
    try {
      // The response is a full DTO, role included — no need to carry it over.
      campaign.value = await useTrpc().campaign.updateCampaign.mutate({
        campaignId: campaign.value.id,
        ...data
      })
    } catch (e) {
      campaign.value = previous
      notifyError(e, 'Could not save the campaign')
    }
  }

  const invalidateTree = () => {
    treeVersion.value++
  }

  return {
    campaign,
    isMaster,
    treeVersion,
    fetchCampaign,
    ensureCampaign,
    updateCampaign,
    invalidateTree
  }
})
