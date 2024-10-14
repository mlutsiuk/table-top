<script setup lang="ts">
const { user } = storeToRefs(useAuthStore())
</script>

<template>
  <div class="flex flex-row items-center justify-between gap-6 border-b p-6 shadow-sm">
    <div class="flex flex-row items-center gap-4">
      <UIcon name="i-fa6-solid-dice-d20" class="size-6" />

      <div class="text-3xl font-medium">
        Table-Top
      </div>
    </div>

    <div class="grow">
      <UButton
        variant="link"
        color="neutral"
        :to="{ name: 'campaigns' }"
        label="Campaigns"
      />
    </div>

    <div class="flex flex-row items-center gap-2">
      <ThemePicker />
      <ColorModeButton />

      <UAvatar
        :alt="user!.name"
        size="md"
      />
    </div>
  </div>
</template>
