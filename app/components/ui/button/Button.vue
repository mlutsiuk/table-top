<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from "."
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import Loader from "@/components/ui/Loader.vue"
import { buttonVariants } from "."
import type { RouteLocationRaw } from '#vue-router'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
  to?: RouteLocationRaw
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
})

const isDisabled = computed(() => (props.to ? undefined : props.disabled || props.loading || undefined))
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :data-loading="loading ? '' : undefined"
    :as="to ? 'template' : as"
    :as-child="to ? true : asChild"
    :disabled="isDisabled"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <NuxtLink
      v-if="to"
      :to
    >
      <slot />
    </NuxtLink>

    <template v-else>
      <Loader v-if="loading" />
      <slot />
    </template>
  </Primitive>
</template>