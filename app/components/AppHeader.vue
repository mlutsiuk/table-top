<script setup lang="ts">
const { user } = storeToRefs(useAuthStore())
</script>

<template>
  <div class="flex flex-row items-center justify-between gap-6 border-b p-6 shadow-sm">
    <div class="flex flex-row items-center gap-4">
      <Icon
        name="fa6-solid:dice-d20"
        class="size-6"
      />

      <div class="text-3xl font-medium">
        Table-Top
      </div>
    </div>

    <div class="grow">
      <Button
        variant="link"
        :to="{ name: 'campaigns' }"
      >
        Campaigns
      </Button>
    </div>

    <div class="flex flex-row items-center gap-2">
      <UserAvatar :user="user!" />
    </div>
  </div>
</template>
