<script setup lang="ts">
import type { Campaign } from '@prisma/client'

const props = defineProps<{
  campaign: Campaign
}>()

const newFund = reactive({
  title: '',
  amount: 0
})
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
      class="flex flex-col gap-1"
    >
      <div
        v-for="(fund, index) in campaign.fundScheme"
        :key="index"
      >
        {{ fund }}
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
        @click=""
        label="Add"
      />
    </div>
  </div>
</template>
