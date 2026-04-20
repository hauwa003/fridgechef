import { useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  type ViewToken,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useOnboardingStore } from '@/store/onboarding'
import { colors, fonts, spacing, radius, shadows, gradients, images } from '@/lib/theme'
import { FadeIn, ScalePress } from '@/lib/animations'

const { width, height } = Dimensions.get('window')

const SLIDES = [
  {
    id: '1',
    image: images.onboarding1,
    title: 'Snap your\nfridge',
    subtitle: 'Just take a photo of what you have — our AI does the rest.',
    accent: '#2D8A5E',
  },
  {
    id: '2',
    image: images.onboarding2,
    title: 'We find your\ningredients',
    subtitle: 'Smart recognition identifies every item, from produce to pantry staples.',
    accent: '#E89B5A',
  },
  {
    id: '3',
    image: images.onboarding3,
    title: 'Cook\nsomething\namazing',
    subtitle: 'Personalized recipes matched to exactly what\'s in your kitchen.',
    accent: '#C44D2B',
  },
] as const

export default function OnboardingScreen() {
  const router = useRouter()
  const complete = useOnboardingStore((s) => s.complete)
  const flatListRef = useRef<FlatList>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
    []
  )

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  async function handleFinish() {
    await complete()
    router.replace('/(tabs)')
  }

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 })
    } else {
      handleFinish()
    }
  }

  const isLast = activeIndex === SLIDES.length - 1

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Full-bleed background image */}
            <Image
              source={{ uri: item.image }}
              style={styles.bgImage}
              resizeMode="cover"
            />

            {/* Gradient overlay for text legibility */}
            <LinearGradient
              colors={['rgba(26,24,20,0.05)', 'rgba(26,24,20,0.85)']}
              locations={[0.3, 1]}
              style={styles.gradient}
            />

            {/* Content at bottom */}
            <View style={styles.slideContent}>
              <FadeIn delay={200} distance={30}>
                <Text style={styles.slideTitle}>{item.title}</Text>
              </FadeIn>
              <FadeIn delay={350} distance={20}>
                <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
              </FadeIn>
            </View>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {!isLast && (
            <ScalePress
              scale={0.97}
              haptic="light"
              onPress={handleFinish}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip</Text>
            </ScalePress>
          )}

          <ScalePress
            scale={0.96}
            haptic="medium"
            onPress={handleNext}
            style={styles.nextButtonWrap}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextButton}
            >
              <Text style={styles.nextText}>
                {isLast ? 'Get Started' : 'Continue'}
              </Text>
            </LinearGradient>
          </ScalePress>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  slide: {
    width,
    height,
    position: 'relative',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  slideContent: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xxxl,
  },
  slideTitle: {
    fontSize: fonts.sizes.display,
    fontWeight: fonts.weights.black,
    color: colors.textOnImage,
    letterSpacing: fonts.tracking.tight,
    lineHeight: fonts.sizes.display * fonts.lineHeights.tight,
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  slideSubtitle: {
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.regular,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: fonts.sizes.body * fonts.lineHeights.relaxed,
    maxWidth: 300,
  },

  // ─── Controls ─────────────────────────────────
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.huge + 10,
  },
  pagination: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  dot: {
    height: 3,
    borderRadius: 2,
  },
  dotActive: {
    width: 32,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  nextButtonWrap: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    ...shadows.glow,
  },
  nextButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  nextText: {
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.bold,
    color: colors.textInverse,
    letterSpacing: fonts.tracking.wide,
  },
})
