import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation } from 'react-query'
import { useSessionStore } from '@/store/session'
import { api } from '@/lib/api'

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const recipes = useSessionStore((s) => s.recipes)
  const recipe = recipes.find((r) => r.id === id)

  const [saved, setSaved] = useState(false)

  const saveMutation = useMutation(
    () => (saved ? api.unsaveRecipe(id) : api.saveRecipe(id)),
    {
      onSuccess: () => setSaved((s) => !s),
      onError: () => Alert.alert('Error', 'Could not save recipe. Try again.'),
    }
  )

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Recipe not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnActive]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isLoading}
        >
          <Text style={[styles.saveBtnText, saved && styles.saveBtnTextActive]}>
            {saved ? '🔖 Saved' : '🔖 Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title + meta */}
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.cook_time_minutes}</Text>
            <Text style={styles.metaLabel}>minutes</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.servings}</Text>
            <Text style={styles.metaLabel}>servings</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.difficulty}</Text>
            <Text style={styles.metaLabel}>difficulty</Text>
          </View>
        </View>

        {/* Ingredients you have */}
        <Text style={styles.sectionTitle}>You have</Text>
        <View style={styles.ingredientList}>
          {recipe.uses.map((ing) => (
            <View key={ing} style={styles.ingredientRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.ingredientName}>{ing}</Text>
            </View>
          ))}
        </View>

        {/* Missing ingredients */}
        {recipe.missing.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>You'll need</Text>
            <View style={styles.ingredientList}>
              {recipe.missing.map((ing) => (
                <View key={ing} style={styles.ingredientRow}>
                  <Text style={styles.plus}>+</Text>
                  <Text style={[styles.ingredientName, styles.missingName]}>{ing}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Steps */}
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.steps}>
          {recipe.steps.map((step) => (
            <View key={step.step_number} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.step_number}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                {step.timer_seconds && (
                  <Text style={styles.stepTimer}>
                    ⏱ {Math.round(step.timer_seconds / 60)} min
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Cook button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cookButton}
          onPress={() =>
            router.push({ pathname: '/session/cook/[id]', params: { id: recipe.id } })
          }
        >
          <Text style={styles.cookButtonText}>Start Cooking →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { fontSize: 15, color: '#16a34a' },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  saveBtnActive: { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
  saveBtnText: { fontSize: 14, color: '#374151' },
  saveBtnTextActive: { color: '#16a34a', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  description: { fontSize: 15, color: '#6b7280', lineHeight: 22, marginBottom: 20 },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metaItem: { alignItems: 'center' },
  metaValue: { fontSize: 18, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  metaLabel: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  metaDivider: { width: 1, height: 32, backgroundColor: '#e5e7eb' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  ingredientList: { marginBottom: 20, gap: 8 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkmark: { fontSize: 14, color: '#16a34a', width: 18, textAlign: 'center' },
  plus: { fontSize: 16, color: '#d97706', width: 18, textAlign: 'center' },
  ingredientName: { fontSize: 15, color: '#111827', textTransform: 'capitalize' },
  missingName: { color: '#92400e' },
  steps: { gap: 16, marginBottom: 8 },
  step: { flexDirection: 'row', gap: 14 },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumberText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepBody: { flex: 1 },
  stepInstruction: { fontSize: 15, color: '#111827', lineHeight: 22 },
  stepTimer: { marginTop: 4, fontSize: 13, color: '#16a34a' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cookButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cookButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  notFound: { padding: 20, fontSize: 16, color: '#6b7280' },
  back: { padding: 20, fontSize: 15, color: '#16a34a' },
})
