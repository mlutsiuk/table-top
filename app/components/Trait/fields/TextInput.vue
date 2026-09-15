<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{ disabled?: boolean }>()
</script>

<template>
  <Input
    v-model="model"
    type="text"
    :disabled="disabled"
  />
</template>
