<script setup lang="ts">
import type { Campaign } from '@prisma/client'

const props = defineProps<{
  campaign: Campaign
}>()
const emit = defineEmits<{
  fundAdded: []
}>()

const newFund = reactive({
  title: '',
  amount: 0
})

const addFund = async () => {
  if (newFund.title && newFund.amount) {
    await useTrpc().campaign.updateFundScheme.mutate({
      campaignId: props.campaign.id,
      fundScheme: [
        ...props.campaign.fundScheme,
        {
          amount: newFund.amount,
          label: newFund.title
        }
      ]
    })

    newFund.title = ''
    newFund.amount = 0

    emit('fundAdded')
  }
}

const deleteFund = async (index: number) => {
  await useTrpc().campaign.updateFundScheme.mutate({
    campaignId: props.campaign.id,
    fundScheme: props.campaign.fundScheme.filter((_, i) => i !== index)
  })

  emit('fundAdded')
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
            color="red"
            class="justify-self-end"
            @click="deleteFund(index)"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-row gap-2">
      <UInput
        v-model="newFund.title"
        placeholder="Title"
      />

      <UInput
        v-model="newFund.amount"
        placeholder="Amount"
        type="number"
      />

      <UButton
        label="Add"
        @click="addFund"
      />
    </div>
  </div>
</template>
