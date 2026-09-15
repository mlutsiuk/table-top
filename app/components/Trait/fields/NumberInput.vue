<script setup lang="ts">
const model = defineModel<number>({ required: true })

defineProps<{ disabled?: boolean }>()
</script>

<template>
  <Input
    :model-value="model"
    type="number"
    :disabled="disabled"
    @update:model-value="model = Number($event) || 0"
  />
</template>
