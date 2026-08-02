<script setup lang="ts">
definePageMeta({
  layout: 'hero',
  middleware: 'guest'
})

const trpcClient = useTrpc()

const inLoading = ref(false)
const login = async () => {
  inLoading.value = true
  const { redirectUrl } = await trpcClient.auth.getAuthUrl.query()

  navigateTo(redirectUrl, {
    external: true
  })
}
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
    <h1 class="text-3xl font-bold">
      Log in
    </h1>

    <p>Log in to get access to great gaming experience</p>

    <Button
      variant="outline"
      :loading="inLoading"
      @click="login"
    >
      <Icon
        name="logos:google-icon"
      />

      Log in with Google
    </Button>
  </div>
</template>
