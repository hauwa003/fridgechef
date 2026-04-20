import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const ONBOARDING_KEY = 'fc_onboarding_complete'

interface OnboardingState {
  hasOnboarded: boolean | null // null = loading
  init: () => Promise<void>
  complete: () => Promise<void>
  reset: () => Promise<void>
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasOnboarded: null,

  async init() {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY)
    set({ hasOnboarded: value === 'true' })
  },

  async complete() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true')
    set({ hasOnboarded: true })
  },

  async reset() {
    await SecureStore.deleteItemAsync(ONBOARDING_KEY)
    set({ hasOnboarded: false })
  },
}))
