<script setup lang="ts">
import { Input } from '@/components/ui/input'

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
