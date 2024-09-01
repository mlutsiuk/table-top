<script setup lang="ts">
import type { RouteLocationRaw } from '#vue-router'

withDefaults(defineProps<{
  to?: RouteLocationRaw
}>(), { })
</script>

<template>
  <ULink
    :to
  >
    <slot />
  </ULink>
</template>
