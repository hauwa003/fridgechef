import { create } from 'zustand'
import type { Session, Ingredient, Recipe } from '@fridgechef/shared'

interface SessionState {
  session: Session | null
  ingredients: Ingredient[]
  recipes: Recipe[]
  warnings: string[]
  setSession: (session: Session) => void
  setIngredients: (ingredients: Ingredient[], warnings?: string[]) => void
  setRecipes: (recipes: Recipe[]) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  ingredients: [],
  recipes: [],
  warnings: [],

  setSession: (session) => set({ session }),
  setIngredients: (ingredients, warnings = []) => set({ ingredients, warnings }),
  setRecipes: (recipes) => set({ recipes }),
  clearSession: () => set({ session: null, ingredients: [], recipes: [], warnings: [] }),
}))
