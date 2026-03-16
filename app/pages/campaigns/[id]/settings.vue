<script setup lang="ts">
const campaignStore = useCampaignStore()

const tabs = [{
  slot: 'funds',
  icon: 'i-ri-copper-coin-fill',
  label: 'Funds'
}, {
  slot: 'sheets',
  icon: 'i-material-symbols-edit-document-rounded',
  label: 'Player sheets'
}, {
  slot: 'players',
  icon: 'i-mdi-account-multiple',
  label: 'Players'
}]
</script>

<template>
  <div
    v-if="!campaignStore.campaign"
    class="flex h-32 items-center justify-center"
  >
    <Loader class="size-8" />
  </div>
  <div
    v-else
    class="flex flex-row gap-8"
  >
    <div class="grow">
      <UTabs
        :items="tabs"
        class="w-full"
      >
        <template #funds>
          <CampaignFund
            :campaign="campaignStore.campaign"
          />
        </template>

        <template #players>
          Players list
        </template>

        <template #sheets>
          Player sheets schemas view
        </template>
      </UTabs>
    </div>

    <div class="hidden min-w-32 flex-col gap-2 rounded-md border p-4 xl:flex">
      <h2 class="text-xl font-bold">
        Details
      </h2>

      <!-- <UDivider /> -->

      <pre>{{ campaignStore.campaign }}</pre>
    </div>
  </div>
</template>
