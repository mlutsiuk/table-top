<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const campaignStore = useCampaignStore()
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
      <Tabs default-value="players" class="w-full">
        <TabsList>
          <TabsTrigger value="sheets">
            <Icon name="material-symbols:edit-document-rounded" class="size-4 mr-1.5" />
            Player sheets
          </TabsTrigger>
          <TabsTrigger value="players">
            <Icon name="lucide:users" class="size-4 mr-1.5" />
            Players
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <CampaignPlayers
            :campaign-id="campaignStore.campaign.id"
            :can-manage="campaignStore.isMaster"
          />
        </TabsContent>
        <TabsContent value="sheets">
          Player sheets schemas view
        </TabsContent>
      </Tabs>
    </div>

    <div class="hidden min-w-32 flex-col gap-2 rounded-md border p-4 xl:flex">
      <h2 class="text-xl font-bold">
        Details
      </h2>
      <pre>{{ campaignStore.campaign }}</pre>
    </div>
  </div>
</template>
