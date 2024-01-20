<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { data, status } = useFetch('/api/users')
</script>

<template>
  <div class="flex flex-col gap-3 rounded border-2 border-gray-200 px-4 py-8">
    <div class="flex flex-row gap-2">
      <ColorModeButton />

      <ColorPicker />
    </div>
    <pre>
      {{ data }}
    </pre>

    {{ status }}

    <h2 class="font-mono text-4xl">
      Its index page
    </h2>

    <hr>
    <div>
      <UButton
        icon="i-tabler-chevron-right"
        variant="solid"
        label="Button"
        :trailing="false"
      />
    </div>
  </div>
</template>
