<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const counterStore = useCounterStore()
const pointer = usePointer()
</script>

<template>
  <div class="px-4 py-8 border-gray-200 border-2 rounded flex flex-col gap-3">
    <h2 class="font-mono text-4xl">
      Its index page
    </h2>

    <hr>
    <h3 class="font-mono text-3xl">Router</h3>
    <NuxtLink
      :to="{
        name: 'welcome'
      }"
      class="underline text-indigo-600"
    >
      Welcome
    </NuxtLink>

    <hr>
    <h3 class="font-mono text-3xl">Pinia</h3>
    <button
      class="bg-gray-400 hover:bg-gray-500 hover:shadow transition-all active:bg-gray-600 text-white text-xl px-4 py-2 rounded mt-2 select-none"
      @click="counterStore.increment"
    >
      Counter store - {{counterStore.count }}
    </button>

    <hr>
    <h3 class="font-mono text-3xl">VueUse</h3>
    <pre>{{ pointer }}</pre>

    
    <hr>
    <h3 class="font-mono text-3xl">Iconify</h3>
    <div class="flex flex-row gap-">
      <!-- <Icon name="logos:nuxt-icon" color="black" size="36px" />
      <Icon name="logos:pinia" color="black" size="36px" />
      <Icon name="logos:vueuse" color="black" size="36px" /> -->
    </div>

  </div>
</template>
