export function useAuth() {
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)
  const isLoggedIn = computed(() => !!authStore.user)

  const logout = () => {
    authStore.logout()
    useRouter().push({
      name: 'auth-login'
    })
  }

  return {
    user,
    isLoggedIn,
    logout
  }
}
