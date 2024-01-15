<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { data, status } = useFetch('/api/users')
</script>

<template>
  <div class="px-4 py-8 border-gray-200 border-2 rounded flex flex-col gap-3">
    <ColorModeButton />
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
