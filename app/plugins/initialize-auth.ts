export default defineNuxtPlugin(async () => {
  const accessTokenCookie = useCookie('access-token')

  if (accessTokenCookie.value) {
    useAuthStore().saveToken(accessTokenCookie.value)
    await useAuthStore().fetchUser()
  }
})
