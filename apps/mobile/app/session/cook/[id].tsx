import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useSessionStore } from '@/store/session'
import { analytics } from '@/lib/analytics'

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const recipes = useSessionStore((s) => s.recipes)
  const recipe = recipes.find((r) => r.id === id)

  const [step, setStep] = useState(0)
  const [cooked, setCooked] = useState(false)

  const steps = recipe?.steps ?? []
  const currentStep = steps[step]
  const isFirst = step === 0
  const isLast = step === steps.length - 1

  useEffect(() => {
    activateKeepAwakeAsync()
    analytics.track('cooking_mode_started', { recipe_id: id })
    return () => {
      deactivateKeepAwake()
    }
  }, [id])

  function handleNext() {
    if (isLast) {
      handleFinish()
    } else {
      analytics.track('cooking_step_advanced', { recipe_id: id, step_number: step + 2 })
      setStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (!isFirst) setStep((s) => s - 1)
  }

  function handleFinish() {
    analytics.track('cooking_completed', { recipe_id: id })
    setCooked(true)
  }

  function handleExit() {
    if (cooked) {
      router.replace('/(tabs)')
      return
    }
    Alert.alert('Stop cooking?', 'Are you sure you want to exit cooking mode?', [
      { text: 'Keep cooking', style: 'cancel' },
      { text: 'Exit', onPress: () => router.replace('/(tabs)') },
    ])
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Recipe not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ── Completion screen ────────────────────────────────────────────────────
  if (cooked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContent}>
          <Text style={styles.completionEmoji}>🍽️</Text>
          <Text style={styles.completionTitle}>Enjoy your meal!</Text>
          <Text style={styles.completionSubtitle}>{recipe.title}</Text>

          <TouchableOpacity
            style={styles.cookedButton}
            onPress={() => {
              analytics.track('recipe_marked_cooked', { recipe_id: id })
              router.replace('/(tabs)')
            }}
          >
            <Text style={styles.cookedButtonText}>✓ Mark as Cooked</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Cooking step screen ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.exitText}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.stepCounter}>{step + 1}/{steps.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / steps.length) * 100}%` },
          ]}
        />
      </View>

      {/* Step content */}
      <View style={styles.stepContent}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {currentStep.step_number}</Text>
        </View>

        <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>

        {currentStep.timer_seconds && (
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>
              ⏱ {currentStep.timer_seconds >= 60
                ? `${Math.round(currentStep.timer_seconds / 60)} min`
                : `${currentStep.timer_seconds} sec`}
            </Text>
          </View>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navButton, isFirst && styles.navButtonDisabled]}
          onPress={handleBack}
          disabled={isFirst}
        >
          <Text style={[styles.navButtonText, isFirst && styles.navButtonTextDisabled]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {isLast ? 'Finish 🎉' : 'Next →'}
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
  exitText: { fontSize: 14, color: '#9ca3af' },
  recipeTitle: { fontSize: 15, fontWeight: '600', color: '#374151', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  stepCounter: { fontSize: 14, color: '#6b7280', minWidth: 36, textAlign: 'right' },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
  },
  stepBadgeText: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  stepInstruction: {
    fontSize: 22,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 34,
    marginBottom: 24,
  },
  timerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef9c3',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timerText: { fontSize: 15, color: '#854d0e', fontWeight: '600' },
  nav: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  navButtonDisabled: { opacity: 0.3 },
  navButtonText: { fontSize: 15, fontWeight: '500', color: '#374151' },
  navButtonTextDisabled: { color: '#9ca3af' },
  nextButton: {
    flex: 2,
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  // Completion
  completionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completionEmoji: { fontSize: 72, marginBottom: 24 },
  completionTitle: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  completionSubtitle: { fontSize: 16, color: '#6b7280', marginBottom: 40, textAlign: 'center' },
  cookedButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  cookedButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  doneButton: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: { color: '#6b7280', fontSize: 15 },
  notFound: { padding: 20, fontSize: 16, color: '#6b7280' },
  link: { paddingHorizontal: 20, fontSize: 15, color: '#16a34a' },
})
