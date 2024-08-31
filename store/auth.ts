import type { User } from '@prisma/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)

  const saveToken = (token: string) => {
    accessToken.value = token
    useCookie('access-token').value = token
  }
  const fetchUser = async () => {
    const response = await useTrpc().auth.getCurrentUser.query()

    if (response)
      user.value = response
  }

  const logout = () => {
    user.value = null
    accessToken.value = null

    useCookie('access-token').value = null
  }

  return {
    user,
    accessToken,
    saveToken,
    fetchUser,
    logout
  }
})
