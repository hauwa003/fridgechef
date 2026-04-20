import { useEffect } from 'react'
import { View, Text, Image, StyleSheet, Dimensions, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useSessionStore } from '@/store/session'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { analytics } from '@/lib/analytics'
import { colors, fonts, spacing, radius, shadows, gradients, images } from '@/lib/theme'
import { FadeIn, ScalePress, BounceIn } from '@/lib/animations'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - spacing.xxl * 2 - spacing.md) / 2

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMealSuggestion(): string {
  const hour = new Date().getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 14) return 'lunch'
  if (hour < 17) return 'a snack'
  return 'dinner'
}

export default function HomeScreen() {
  const router = useRouter()
  const setSession = useSessionStore((s) => s.setSession)
  const initAuth = useAuthStore((s) => s.init)
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    analytics.track('home_opened')
  }, [])

  async function startSession(destination: '/session/capture' | '/session/ingredients') {
    try {
      if (!accessToken) await initAuth()
      const session = await api.createSession()
      setSession(session)
      router.push(destination)
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not connect to server. Is the API running?')
    }
  }

  async function handleScanFridge() {
    analytics.track('scan_cta_tapped')
    await startSession('/session/capture')
  }

  async function handleTypeIngredients() {
    analytics.track('manual_entry_tapped')
    await startSession('/session/ingredients')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Greeting */}
        <FadeIn delay={100} from="top" distance={14}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.greetingSub}>
              Ready to cook {getMealSuggestion()}?
            </Text>
          </View>
        </FadeIn>

        {/* Hero Card */}
        <FadeIn delay={200} distance={24}>
          <ScalePress scale={0.98} haptic="medium" onPress={handleScanFridge}>
            <View style={styles.heroCard}>
              <Image
                source={{ uri: images.homeHero }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={gradients.heroFull}
                locations={[0.2, 1]}
                style={styles.heroOverlay}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>AI-Powered</Text>
                </View>
                <Text style={styles.heroTitle}>
                  Scan your fridge,{'\n'}get recipes instantly
                </Text>
                <Text style={styles.heroSubtitle}>
                  Just snap a photo — our AI identifies ingredients and creates personalized recipes
                </Text>
                <View style={styles.heroButton}>
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroButtonGradient}
                  >
                    <Text style={styles.heroButtonIcon}>📷</Text>
                    <Text style={styles.heroButtonText}>Open Camera</Text>
                  </LinearGradient>
                </View>
              </View>
            </View>
          </ScalePress>
        </FadeIn>

        {/* Two-Column CTAs */}
        <FadeIn delay={350} distance={18}>
          <View style={styles.ctaRow}>
            {/* Quick Scan Card */}
            <ScalePress
              scale={0.96}
              haptic="light"
              onPress={handleScanFridge}
              style={styles.ctaCard}
            >
              <Image
                source={{ uri: images.homeScan }}
                style={styles.ctaImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={gradients.card}
                style={styles.ctaOverlay}
              />
              <View style={styles.ctaContent}>
                <Text style={styles.ctaEmoji}>📸</Text>
                <Text style={styles.ctaTitle}>Quick{'\n'}Scan</Text>
              </View>
            </ScalePress>

            {/* Manual Entry Card */}
            <ScalePress
              scale={0.96}
              haptic="light"
              onPress={handleTypeIngredients}
              style={styles.ctaCard}
            >
              <Image
                source={{ uri: images.homeType }}
                style={styles.ctaImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={gradients.card}
                style={styles.ctaOverlay}
              />
              <View style={styles.ctaContent}>
                <Text style={styles.ctaEmoji}>✏️</Text>
                <Text style={styles.ctaTitle}>Type{'\n'}Ingredients</Text>
              </View>
            </ScalePress>
          </View>
        </FadeIn>

        {/* How It Works */}
        <FadeIn delay={450} distance={16}>
          <View style={styles.howSection}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={styles.stepsRow}>
              {[
                { num: '1', label: 'Snap', icon: '📷' },
                { num: '2', label: 'Detect', icon: '🔍' },
                { num: '3', label: 'Cook', icon: '🍳' },
              ].map((step, i) => (
                <BounceIn key={step.num} delay={500 + i * 100}>
                  <View style={styles.stepItem}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                    </View>
                    <Text style={styles.stepLabel}>{step.label}</Text>
                  </View>
                </BounceIn>
              ))}
            </View>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: spacing.xxxl,
  },

  // ─── Greeting ─────────────────────────────────
  greetingSection: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: fonts.sizes.h1,
    fontWeight: fonts.weights.black,
    color: colors.textPrimary,
    letterSpacing: fonts.tracking.snug,
  },
  greetingSub: {
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ─── Hero Card ────────────────────────────────
  heroCard: {
    marginHorizontal: spacing.xxl,
    borderRadius: radius.xl,
    overflow: 'hidden',
    height: 320,
    ...shadows.hero,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xxl,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: {
    fontSize: fonts.sizes.label,
    fontWeight: fonts.weights.semibold,
    color: colors.textOnImage,
    letterSpacing: fonts.tracking.wide,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: fonts.sizes.h2,
    fontWeight: fonts.weights.bold,
    color: colors.textOnImage,
    lineHeight: fonts.sizes.h2 * fonts.lineHeights.snug,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fonts.sizes.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: fonts.sizes.bodySmall * fonts.lineHeights.normal,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  heroButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    overflow: 'hidden',
    ...shadows.glow,
  },
  heroButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  heroButtonIcon: {
    fontSize: 16,
  },
  heroButtonText: {
    fontSize: fonts.sizes.bodySmall,
    fontWeight: fonts.weights.bold,
    color: colors.textInverse,
  },

  // ─── CTA Cards ────────────────────────────────
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.lg,
  },
  ctaCard: {
    flex: 1,
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  ctaImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  ctaOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ctaContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  ctaEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  ctaTitle: {
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.bold,
    color: colors.textOnImage,
    lineHeight: fonts.sizes.body * fonts.lineHeights.snug,
  },

  // ─── How It Works ─────────────────────────────
  howSection: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.caption,
    fontWeight: fonts.weights.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: fonts.tracking.wider,
    marginBottom: spacing.xl,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryPale,
  },
  stepIcon: {
    fontSize: 24,
  },
  stepLabel: {
    fontSize: fonts.sizes.bodySmall,
    fontWeight: fonts.weights.semibold,
    color: colors.textSecondary,
  },
})
