import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'fc_access_token'
const REFRESH_KEY = 'fc_refresh_token'

interface AuthState {
  accessToken: string | null
  userId: string | null
  isReady: boolean
  init: () => Promise<void>
  setTokens: (access: string, refresh: string, userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  isReady: false,

  async init() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    if (token) {
      // TODO: validate / refresh token before trusting it
      set({ accessToken: token, isReady: true })
      return
    }

    // No token — create anonymous session
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/anonymous`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.access_token) {
        await SecureStore.setItemAsync(TOKEN_KEY, data.access_token)
        await SecureStore.setItemAsync(REFRESH_KEY, data.refresh_token)
        set({ accessToken: data.access_token, userId: data.user_id, isReady: true })
      }
    } catch {
      set({ isReady: true })
    }
  },

  async setTokens(access, refresh, userId) {
    await SecureStore.setItemAsync(TOKEN_KEY, access)
    await SecureStore.setItemAsync(REFRESH_KEY, refresh)
    set({ accessToken: access, userId })
  },

  async signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
    set({ accessToken: null, userId: null })
  },
}))
