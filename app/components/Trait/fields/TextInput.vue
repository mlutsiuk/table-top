<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <Input
    v-model="model"
    type="text"
    :disabled="disabled"
  />
</template>
