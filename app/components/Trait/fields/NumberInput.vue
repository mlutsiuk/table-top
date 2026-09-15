<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const model = defineModel<number>({ required: true })
</script>

<template>
  <Input
    :model-value="model"
    type="number"
    :disabled="disabled"
    @update:model-value="model = Number($event) || 0"
  />
</template>
