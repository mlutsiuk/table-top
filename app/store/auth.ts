import type { User } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)

  const saveToken = (token: string) => {
    accessToken.value = token
    useCookie('access-token').value = token
  }
  const fetchUser = async () => {
    try {
      const response = await useTrpc().auth.getCurrentUser.query()

      user.value = response
    }
    catch (e) {
      if (e instanceof TRPCError) {
        alert('Check console')
        console.error(e.cause, e.code, e.message, e.name, e.stack)
      }
    }
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
