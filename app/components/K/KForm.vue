<script setup lang="ts">
import { UForm } from '#components'
import type { FormError, FormEventType, FormSubmitEvent } from '#ui/types'

defineProps<{
  state: Record<string, any>
  schema: any
  validateOn?: FormEventType[]
}>()
const emit = defineEmits<{
  submit: [e: FormSubmitEvent<any>]
}>()
const form = ref<InstanceType<typeof UForm> | null>(null)
const clear = (path?: string) => {
  form.value?.clear(path)
}
const submit = () => {
  form.value?.submit()
}
const setErrors = (errors: FormError[], path?: string) => {
  form.value?.setErrors(errors, path)
}
const getErrors = (path?: string) => {
  return form.value?.getErrors(path)
}
defineExpose({
  clear,
  submit,
  setErrors,
  getErrors
})
</script>

<template>
  <UForm
    ref="form"
    :state="state"
    :schema="schema"
    :validate-on="validateOn"
    @submit="emit('submit', $event)"
  >
    <slot />
  </UForm>
</template>
