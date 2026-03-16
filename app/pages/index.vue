<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { data, status } = useFetch('/api/users')
</script>

<template>
  <div class="flex flex-col gap-3 rounded border-2 border-gray-200 px-4 py-8">
    <div class="flex flex-row gap-2">
      <ColorModeButton />
    </div>
    <pre>{{ data }}</pre>

    {{ status }}

    <h2 class="font-mono text-4xl">
      Its index page
    </h2>

    <hr>
    <div>
      <Button
        variant="destructive"
        :trailing="false"
      >
        Button
        <Icon name="tabler:chevron-right" /> 
      </Button>
    </div>
  </div>
</template>
