<script setup lang="ts">
const { $client } = useNuxtApp()

const hello = await $client.hello.query({ text: 'client' })
</script>

<template>
  <div v-if="hello">
    <p>{{ hello }}</p>
  </div>
</template>
