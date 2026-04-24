import { create } from 'zustand'
import { authApi } from '@/lib/api'

type User = {
  id: string
  name: string
  email: string
  role?: string
}

type AuthState = {
  user: User | null
  loading: boolean
  initialized: boolean

  signup: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  signup: async (name, email, password) => {
    set({ loading: true })

    await authApi.signup({ name, email, password })

    set({
      loading: false,
      initialized: true,
    })
  },

  login: async (email, password) => {
    set({ loading: true })

    const res = await authApi.login({ email, password })

    set({
      user: res.user,
      loading: false,
      initialized: true,
    })
  },

  logout: async () => {
    await authApi.logout()

    set({
      user: null,
      loading: false,
      initialized: true,
    })
  },

  fetchMe: async () => {
    set({ loading: true })

    try {
      const res = await authApi.me()

      set({
        user: res.user,
        loading: false,
        initialized: true,
      })
    } catch {
      set({
        user: null,
        loading: false,
        initialized: true,
      })
    }
  },
}))