<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from "."
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "."
import type { RouteLocationRaw } from '#vue-router'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
  to?: RouteLocationRaw
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
})
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :as="to ? 'template' : as"
    :as-child="to ? true : asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <NuxtLink
      v-if="to"
      :to
    >
      <slot />
    </NuxtLink>
    
    <template v-else>
      <slot />
    </template>
  </Primitive>
</template>