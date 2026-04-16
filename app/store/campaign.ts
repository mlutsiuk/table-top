import type { Campaign } from '@prisma/client'

export const useCampaignStore = defineStore('campaign', () => {
  const campaign = ref<Campaign | null>(null)
  const treeVersion = ref(0)

  const fetchCampaign = async (campaignId: string) => {
    try {
      const response = await useTrpc().campaign.getCampaignDetails.query({ campaignId })
      if (response) campaign.value = response
    } catch {
      // TODO
    }
  }

  const updateCampaign = async (data: { title?: string; status?: Campaign['status'] }) => {
    if (!campaign.value) return
    try {
      const updated = await useTrpc().campaign.updateCampaign.mutate({
        campaignId: campaign.value.id,
        ...data
      })
      campaign.value = updated
    } catch {
      // TODO
    }
  }

  const invalidateTree = () => {
    treeVersion.value++
  }

  return {
    campaign,
    treeVersion,
    fetchCampaign,
    updateCampaign,
    invalidateTree,
  }
})
