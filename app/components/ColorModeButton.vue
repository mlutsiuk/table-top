<script setup>
const colorMode = useColorMode()

const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})
</script>

<template>
  <ClientOnly>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Theme"
      @click="isDark = !isDark"
    >
      <Icon
        :name="isDark ? 'heroicons:moon-20-solid' : 'heroicons:sun-20-solid'"
        class="size-5"
      />
    </Button>

    <template #fallback>
      <div class="w-8 h-8" />
    </template>
  </ClientOnly>
</template>
