import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSessionStore } from '@/store/session'
import { api } from '@/lib/api'
import {
  DIET_TAGS,
  CUISINE_TAGS,
  EQUIPMENT_TAGS,
  COOK_TIME_OPTIONS,
} from '@fridgechef/shared'

type Prefs = {
  cook_time_max: number | null
  diet_tags: string[]
  allergy_tags: string[]
  cuisine_tags: string[]
  equipment_tags: string[]
  servings: number
}

function TagButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.tag, active && styles.tagActive]}
      onPress={onPress}
    >
      <Text style={[styles.tagText, active && styles.tagTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export default function PreferencesScreen() {
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const setRecipes = useSessionStore((s) => s.setRecipes)

  const [prefs, setPrefs] = useState<Prefs>({
    cook_time_max: null,
    diet_tags: [],
    allergy_tags: [],
    cuisine_tags: [],
    equipment_tags: [],
    servings: 2,
  })
  const [loading, setLoading] = useState(false)

  async function generateRecipes(withPrefs?: Prefs) {
    if (!session) return
    setLoading(true)
    try {
      const recipes = await api.generateRecipes(session.id, withPrefs ?? undefined)
      setRecipes(recipes)
      router.push('/session/recipes')
    } catch (err: any) {
      Alert.alert(
        'Failed to generate recipes',
        err.code === 'RATE_LIMIT_EXCEEDED'
          ? 'Daily scan limit reached. Sign in for more.'
          : 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Generating recipes…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <TouchableOpacity onPress={() => generateRecipes()}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Cook time */}
        <Text style={styles.sectionLabel}>Cook Time</Text>
        <View style={styles.row}>
          {([...COOK_TIME_OPTIONS, null] as (number | null)[]).map((t) => (
            <TagButton
              key={String(t)}
              label={t ? `${t} min` : 'Any'}
              active={prefs.cook_time_max === t}
              onPress={() => setPrefs((p) => ({ ...p, cook_time_max: t }))}
            />
          ))}
        </View>

        {/* Servings */}
        <Text style={styles.sectionLabel}>Servings</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 6].map((n) => (
            <TagButton
              key={n}
              label={String(n)}
              active={prefs.servings === n}
              onPress={() => setPrefs((p) => ({ ...p, servings: n }))}
            />
          ))}
        </View>

        {/* Diet */}
        <Text style={styles.sectionLabel}>Diet</Text>
        <View style={styles.wrap}>
          {DIET_TAGS.map((tag) => (
            <TagButton
              key={tag}
              label={tag}
              active={prefs.diet_tags.includes(tag)}
              onPress={() => setPrefs((p) => ({ ...p, diet_tags: toggle(p.diet_tags, tag) }))}
            />
          ))}
        </View>

        {/* Cuisine */}
        <Text style={styles.sectionLabel}>Cuisine</Text>
        <View style={styles.wrap}>
          {CUISINE_TAGS.map((tag) => (
            <TagButton
              key={tag}
              label={tag}
              active={prefs.cuisine_tags.includes(tag)}
              onPress={() =>
                setPrefs((p) => ({ ...p, cuisine_tags: toggle(p.cuisine_tags, tag) }))
              }
            />
          ))}
        </View>

        {/* Equipment */}
        <Text style={styles.sectionLabel}>Equipment</Text>
        <View style={styles.wrap}>
          {EQUIPMENT_TAGS.map((tag) => (
            <TagButton
              key={tag}
              label={tag}
              active={prefs.equipment_tags.includes(tag)}
              onPress={() =>
                setPrefs((p) => ({ ...p, equipment_tags: toggle(p.equipment_tags, tag) }))
              }
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => generateRecipes(prefs)}
        >
          <Text style={styles.generateButtonText}>Generate Recipes →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6b7280' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  back: { fontSize: 15, color: '#16a34a' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  skip: { fontSize: 15, color: '#6b7280' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 20,
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  tagActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  tagText: { fontSize: 14, color: '#374151' },
  tagTextActive: { color: '#fff', fontWeight: '600' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  generateButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
