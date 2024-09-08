import type { Campaign } from '@prisma/client'
import type { FundScheme } from '~/types/campaign'

export const useCampaignStore = defineStore('campaign', () => {
  const campaign = ref<Campaign | null>()

  const fetchCampaign = async (campaignId: string) => {
    try {
      const response = await useTrpc().campaign.getCampaignDetails.query({
        campaignId
      })

      if (response)
        campaign.value = response
    }
    catch {
      // TODO
    }
  }

  const saveCampaign = (newCampaign: Campaign) => {
    campaign.value = newCampaign
  }

  const updateFundsScheme = async (newScheme: FundScheme[]) => {
    if (!campaign.value)
      return

    try {
      const updatedCampaign = await useTrpc().campaign.updateFundScheme.mutate({
        campaignId: campaign.value.id,
        fundScheme: newScheme
      })

      saveCampaign(updatedCampaign)
    }
    catch {
      // TODO
    }
  }

  return {
    campaign,

    fetchCampaign,
    updateFundsScheme
  }
})
