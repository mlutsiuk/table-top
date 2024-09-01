<script setup lang="ts">
const route = useRoute('campaigns-id')

const { data, status } = useTrpc().campaign.getCampaignDetails.useQuery({
  campaignId: route.params.id as string
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-3xl font-medium">
      Campaign - {{ route.params.id }}
    </h1>

    <pre>{{ data }}</pre>
    <pre>{{ status }}</pre>
  </div>
</template>
