<template>
  <div class="flex min-h-screen flex-col items-stretch">
    <div class="flex flex-row items-center justify-between border-b p-6 shadow-sm">
      <div class="flex flex-row items-center gap-4">
        <UIcon name="i-fa6-solid-dice-d20" class="size-6" />

        <div class="text-3xl font-medium">
          Table-Top
        </div>
      </div>

      <div class="flex flex-row items-center gap-2">
        <ColorPicker />
        <ColorModeButton />
      </div>
    </div>

    <div class="grow p-6">
      <slot />
    </div>
  </div>
</template>
