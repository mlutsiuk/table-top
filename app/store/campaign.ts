import type { Campaign } from '@prisma/client'
import type { CampaignRole, CampaignStatus } from '#shared/types/campaign'

type CampaignWithRole = Campaign & { role: CampaignRole }

export const useCampaignStore = defineStore('campaign', () => {
  const campaign = ref<CampaignWithRole | null>(null)
  const treeVersion = ref(0)

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
      const updated = await useTrpc().campaign.updateCampaign.mutate({
        campaignId: campaign.value.id,
        ...data
      })
      campaign.value = { ...updated, role: previous.role }
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
