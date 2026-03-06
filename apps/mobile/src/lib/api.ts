import { useAuthStore } from '@/store/auth'
import type { PreferencesInput } from '@fridgechef/shared'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'UNKNOWN' }))
    throw Object.assign(new Error(err.message ?? err.error), {
      code: err.error,
      status: res.status,
    })
  }

  return res.json() as Promise<T>
}

export const api = {
  // Sessions
  createSession: () => request<{ session: any }>('/sessions', { method: 'POST' }).then((d) => d.session),
  getSession: (id: string) => request<{ session: any }>(`/sessions/${id}`),

  getUploadUrl: (sessionId: string) =>
    request<{ upload_url: string; storage_key: string }>(`/sessions/${sessionId}/images/upload-url`, { method: 'POST' }),

  confirmImage: (sessionId: string, body: { storage_key: string; size_bytes: number; mime_type: string }) =>
    request(`/sessions/${sessionId}/images/confirm`, { method: 'POST', body: JSON.stringify(body) }),

  extractIngredients: (sessionId: string) =>
    request<{ ingredients: any[]; warnings: string[] }>(`/sessions/${sessionId}/extract`, { method: 'POST' }),

  updateIngredients: (sessionId: string, ingredients: any[]) =>
    request(`/sessions/${sessionId}/ingredients`, {
      method: 'PATCH',
      body: JSON.stringify({ ingredients }),
    }),

  generateRecipes: (sessionId: string, preferences?: PreferencesInput) =>
    request<{ recipes: any[] }>(`/sessions/${sessionId}/recipes`, {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    }).then((d) => d.recipes),

  // Recipes
  saveRecipe: (recipeId: string) =>
    request(`/recipes/${recipeId}/save`, { method: 'POST' }),

  unsaveRecipe: (recipeId: string) =>
    request(`/recipes/${recipeId}/save`, { method: 'DELETE' }),

  // Users
  getSavedRecipes: () => request<{ saved: any[] }>('/users/me/saved'),
  getHistory: () => request<{ sessions: any[] }>('/users/me/history'),
  getPreferences: () => request<{ preferences: any }>('/users/me/preferences'),
  updatePreferences: (prefs: any) =>
    request('/users/me/preferences', { method: 'PUT', body: JSON.stringify(prefs) }),
  deleteAccount: () => request('/users/me', { method: 'DELETE' }),

  // Analytics (fire and forget)
  trackEvents: (events: any[]) => {
    request('/analytics/events', {
      method: 'POST',
      body: JSON.stringify({ events }),
    }).catch(() => {}) // never throw from analytics
  },
}
