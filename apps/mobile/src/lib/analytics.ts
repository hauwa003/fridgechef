import { AppState, AppStateStatus } from 'react-native'
import { useSessionStore } from '@/store/session'
import { api } from './api'

interface QueuedEvent {
  event_name: string
  session_id?: string
  properties: Record<string, unknown>
  occurred_at: string
}

const FLUSH_THRESHOLD = 10 // flush when queue hits this size

class AnalyticsQueue {
  private queue: QueuedEvent[] = []
  private flushing = false

  constructor() {
    // Flush when app goes to background (best-effort)
    AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') this.flush()
    })
  }

  track(eventName: string, properties: Record<string, unknown> = {}) {
    const session = useSessionStore.getState().session

    this.queue.push({
      event_name: eventName,
      session_id: session?.id,
      properties,
      occurred_at: new Date().toISOString(),
    })

    if (this.queue.length >= FLUSH_THRESHOLD) {
      this.flush()
    }
  }

  async flush() {
    if (this.flushing || this.queue.length === 0) return
    this.flushing = true

    const batch = this.queue.splice(0, 50) // max 50 per request
    try {
      await api.trackEvents(batch)
    } catch {
      // Re-queue on failure (best effort — discard if repeated failure)
      if (this.queue.length < 100) {
        this.queue.unshift(...batch)
      }
    } finally {
      this.flushing = false
    }
  }
}

export const analytics = new AnalyticsQueue()
