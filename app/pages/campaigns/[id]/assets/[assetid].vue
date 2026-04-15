<script setup lang="ts">
const route = useRoute('campaigns-id-assets-assetid')
const assetId = computed(() => route.params.assetid as string)
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0 pt-4">
    <MaterialEditor :key="assetId" class="grow" />
  </div>
</template>
