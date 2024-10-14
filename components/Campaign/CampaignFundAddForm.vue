<script setup lang="ts">
import { z } from 'zod'
import { KForm } from '#components'

const campaignStore = useCampaignStore()

const form = ref<InstanceType<typeof KForm> | null>(null)
const state = reactive({
  title: '',
  amount: 0
})

const isLoading = ref(false)
const { schema, onSubmit } = useForm({
  form,
  schema: z.object({
    title: z.string().min(1, 'Required').max(32, 'Too long'),
    amount: z.number().int().positive()
  }),
  async onSubmit({ data }) {
    if (!campaignStore.campaign)
      return

    isLoading.value = true
    const newScheme = [
      ...campaignStore.campaign.fundScheme,
      {
        amount: data.amount,
        label: data.title
      }
    ].sort((a, b) => a.amount - b.amount)

    await campaignStore.updateFundsScheme(newScheme)

    state.title = ''
    state.amount = 0

    isLoading.value = false
  }
})
</script>

<template>
  <KForm
    ref="form"
    :schema
    :state
    class="flex flex-row gap-2"
    @submit="onSubmit"
  >
    <UFormField
      name="title"
      label="Title"
    >
      <UInput
        v-model="state.title"
        placeholder="Gold"
      />
    </UFormField>

    <UFormField
      name="amount"
      label="Amount"
    >
      <UInput
        v-model="state.amount"
        placeholder="Amount"
        type="number"
      />
    </UFormField>

    <UButton
      label="Add"
      type="submit"
      :loading="isLoading"
      :disabled="isLoading"
    />
  </KForm>
</template>
