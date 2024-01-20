import type { User } from '@prisma/client'

type State = {
  user: User | null
  accessToken: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    user: null,
    accessToken: null
  }),
  getters: {

  },
  actions: {
    saveToken(token: string) {
      this.accessToken = token
      useCookie('access-token').value = token
    },
    async fetchUser() {
      const token = useAuthStore().accessToken

      const { data } = await useFetch('/api/user', {
        headers: token
          ? {
              Authorization: `Bearer ${token}`
            }
          : {}
      })

      if (data.value)
        this.user = data.value
    },
    logout() {
      this.user = null
      this.accessToken = null

      useCookie('access-token').value = null
    }
  }
})
