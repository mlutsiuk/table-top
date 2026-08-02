import type { User } from '@prisma/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)

  const saveToken = (token: string) => {
    accessToken.value = token
    useCookie('access-token').value = token
  }

  const logout = () => {
    user.value = null
    accessToken.value = null

    useCookie('access-token').value = null
  }

  const fetchUser = async () => {
    try {
      user.value = await useTrpc().auth.getCurrentUser.query()
    }
    catch (e) {
      if (isUnauthorized(e)) {
        logout()
        return
      }

      notifyError(e, 'Could not load your profile')
    }
  }

  return {
    user,
    accessToken,
    saveToken,
    fetchUser,
    logout
  }
})
