<script setup lang="ts">
const { data, status, refresh } = useTrpc().campaign.getUserCampaigns.useQuery(undefined, {
  // immediate: false
})

const newCampaignTitle = ref('')
const createCampaign = async () => {
  await useTrpc().campaign.createCampaign.mutate({
    title: newCampaignTitle.value
  })

  await refresh()
  newCampaignTitle.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-row items-center justify-between">
      <h1 class="text-3xl font-medium">
        Campaigns
      </h1>

      <div class="flex flex-row gap-2">
        <UInput v-model="newCampaignTitle" />
        <UButton
          label="Create Campaign"
          @click="createCampaign"
        />
      </div>
    </div>

    <div
      v-if="!data || status === 'pending'"
      class="flex min-h-[200px] items-center justify-center"
    >
      <KLoader class="size-8" />
    </div>
    <div
      v-else
      class="grid grid-cols-3 gap-2"
    >
      <CampaignCard
        v-for="campaign in data"
        :key="campaign.id"
        :campaign="campaign"
      />
    </div>
  </div>
</template>
