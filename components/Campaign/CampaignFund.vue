<script setup lang="ts">
import type { Campaign } from '@prisma/client'

const props = defineProps<{
  campaign: Campaign
}>()

const campaignStore = useCampaignStore()

const deleteFund = async (index: number) => {
  const updated = await useTrpc().campaign.updateFundScheme.mutate({
    campaignId: props.campaign.id,
    fundScheme: props.campaign.fundScheme.filter((_, i) => i !== index)
  })

  campaignStore.saveCampaign(updated)
}
</script>

<template>
  <div class="flex flex-col gap-4 py-2">
    <h3 class="text-lg font-bold">
      Campaign funds settings
    </h3>

    <div v-if="campaign.fundScheme.length === 0">
      <div class="text-gray-400">
        Scheme is not defined
      </div>
    </div>
    <div
      v-else
      class="flex w-fit flex-col gap-1"
    >
      <div
        v-for="(fund, index) in campaign.fundScheme"
        :key="index"
      >
        <div class="flex flex-row items-center justify-between gap-6 bg-gray-200 px-4 font-mono dark:bg-gray-800">
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-16 text-3xl">
              {{ fund.amount }}
            </div>
            <div class="dark:text-gray-400">
              {{ fund.label }}
            </div>
          </div>

          <UButton
            icon="i-mdi-delete"
            variant="link"
            color="error"
            class="justify-self-end"
            @click="deleteFund(index)"
          />
        </div>
      </div>
    </div>

    <CampaignFundAddForm />
  </div>
</template>
