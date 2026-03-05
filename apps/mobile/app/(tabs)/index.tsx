import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSessionStore } from '@/store/session'
import { api } from '@/lib/api'
import { analytics } from '@/lib/analytics'

export default function HomeScreen() {
  const router = useRouter()
  const setSession = useSessionStore((s) => s.setSession)

  useEffect(() => {
    analytics.track('home_opened')
  }, [])

  async function handleScanFridge() {
    analytics.track('scan_cta_tapped')
    const session = await api.createSession()
    setSession(session)
    router.push('/session/capture')
  }

  function handleTypeIngredients() {
    analytics.track('manual_entry_tapped')
    router.push('/session/ingredients')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FridgeChef</Text>
        <Text style={styles.subtitle}>What's in your fridge?</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleScanFridge}>
          <Text style={styles.primaryButtonText}>📷  Scan Fridge</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleTypeIngredients}>
          <Text style={styles.secondaryButtonText}>Type Ingredients</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 48 },
  primaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: { color: '#374151', fontSize: 16, fontWeight: '500' },
})
