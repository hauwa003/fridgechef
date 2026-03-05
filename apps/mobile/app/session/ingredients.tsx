import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSessionStore } from '@/store/session'
import { api } from '@/lib/api'
import { CONFIDENCE_THRESHOLDS } from '@fridgechef/shared'

type EditingState = { id: string; value: string } | null

function confidenceLabel(confidence: number | undefined): { label: string; color: string } {
  if (confidence === undefined) return { label: 'Manual', color: '#6b7280' }
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return { label: 'High', color: '#16a34a' }
  if (confidence >= CONFIDENCE_THRESHOLDS.MED) return { label: 'Med', color: '#d97706' }
  return { label: 'Low', color: '#dc2626' }
}

export default function IngredientsScreen() {
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const storeIngredients = useSessionStore((s) => s.ingredients)
  const warnings = useSessionStore((s) => s.warnings)

  const [ingredients, setIngredients] = useState(
    storeIngredients.length > 0
      ? storeIngredients
      : []
  )
  const [newIngredient, setNewIngredient] = useState('')
  const [editing, setEditing] = useState<EditingState>(null)
  const [saving, setSaving] = useState(false)

  const remove = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const startEdit = useCallback((id: string, name: string) => {
    setEditing({ id, value: name })
  }, [])

  const commitEdit = useCallback(() => {
    if (!editing) return
    const trimmed = editing.value.trim().toLowerCase()
    if (trimmed) {
      setIngredients((prev) =>
        prev.map((i) => (i.id === editing.id ? { ...i, name: trimmed } : i))
      )
    }
    setEditing(null)
  }, [editing])

  const addManual = useCallback(() => {
    const name = newIngredient.trim().toLowerCase()
    if (!name) return
    if (ingredients.some((i) => i.name === name)) {
      Alert.alert('Already added', `"${name}" is already in your list.`)
      return
    }
    setIngredients((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        session_id: session?.id ?? '',
        name,
        confidence: undefined as any,
        source: 'manual' as const,
        is_active: true,
      },
    ])
    setNewIngredient('')
  }, [newIngredient, ingredients, session])

  const handleConfirm = useCallback(async () => {
    if (!session) return
    if (ingredients.length === 0) {
      Alert.alert('No ingredients', 'Add at least one ingredient before continuing.')
      return
    }

    setSaving(true)
    try {
      await api.updateIngredients(
        session.id,
        ingredients.map((i) => ({
          id: i.id?.startsWith('manual-') ? undefined : i.id,
          name: i.name,
          is_active: true,
        }))
      )
      router.push('/session/preferences')
    } catch {
      Alert.alert('Error', 'Failed to save ingredients. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [session, ingredients, router])

  const activeIngredients = ingredients.filter((i) => i.is_active !== false)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ingredients Found</Text>
        <Text style={styles.count}>{activeIngredients.length} items</Text>
      </View>

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ {warnings.includes('low_light') ? 'Low light detected. ' : ''}
            {warnings.includes('blurry') ? 'Photo was blurry. ' : ''}
            {warnings.includes('occluded') ? 'Some items may be hidden. ' : ''}
            You can edit the list below.
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Empty state */}
        {activeIngredients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No ingredients detected.</Text>
            <Text style={styles.emptySubtext}>Add them manually below.</Text>
          </View>
        )}

        {/* Chips */}
        <View style={styles.chipsWrap}>
          {activeIngredients.map((ing) => {
            const badge = confidenceLabel(ing.confidence)
            const isEditing = editing?.id === ing.id

            return (
              <View key={ing.id} style={styles.chip}>
                {isEditing ? (
                  <TextInput
                    style={styles.chipInput}
                    value={editing.value}
                    onChangeText={(v) => setEditing({ id: ing.id, value: v })}
                    onBlur={commitEdit}
                    onSubmitEditing={commitEdit}
                    autoFocus
                    returnKeyType="done"
                  />
                ) : (
                  <TouchableOpacity onPress={() => startEdit(ing.id, ing.name)}>
                    <Text style={styles.chipName}>{ing.name}</Text>
                  </TouchableOpacity>
                )}

                <View style={[styles.badge, { backgroundColor: badge.color + '22' }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>

                <TouchableOpacity
                  style={styles.chipRemove}
                  onPress={() => remove(ing.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.chipRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            )
          })}
        </View>

        {/* Add manually */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Add ingredient…"
            placeholderTextColor="#9ca3af"
            value={newIngredient}
            onChangeText={setNewIngredient}
            onSubmitEditing={addManual}
            returnKeyType="done"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.addButton, !newIngredient.trim() && styles.addButtonDisabled]}
            onPress={addManual}
            disabled={!newIngredient.trim()}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirm */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, saving && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={saving}
        >
          <Text style={styles.confirmButtonText}>
            {saving ? 'Saving…' : `Confirm ${activeIngredients.length} Ingredient${activeIngredients.length !== 1 ? 's' : ''} →`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  count: { fontSize: 14, color: '#6b7280' },
  warningBanner: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  warningText: { fontSize: 13, color: '#92400e', lineHeight: 18 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#9ca3af' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
    gap: 6,
  },
  chipName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  chipInput: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    minWidth: 60,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#16a34a',
  },
  badge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: { fontSize: 9, color: '#6b7280', fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addButtonDisabled: { backgroundColor: '#d1d5db' },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
