<script setup lang="ts">
const route = useRoute('campaigns-id')

const { data, status, refresh } = useTrpc().campaign.getCampaignDetails.useQuery({
  campaignId: route.params.id as string
})

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
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-medium">
        {{ data?.title }}
      </h1>
      <div class="text-sm dark:text-gray-400">
        {{ data?.id }}
      </div>
    </div>

    <div
      v-if="!data"
      class="flex h-32 items-center justify-center"
    >
      <KLoader class="size-8" />
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
            <CampaignFunds
              :campaign="data"
              @fund-added="refresh"
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

        <UDivider />

        <pre>{{ data }}</pre>
        <pre>Status - {{ status }}</pre>
      </div>
    </div>
  </div>
</template>
