import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useAuthStore } from '@/store/auth'
import { useOnboardingStore } from '@/store/onboarding'
import { fonts, gradients } from '@/lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
    mutations: { retry: 1 },
  },
})

function SplashScreen({ onReady }: { onReady: () => void }) {
  const logoScale = useRef(new Animated.Value(0.3)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const nameOpacity = useRef(new Animated.Value(0)).current
  const nameTranslate = useRef(new Animated.Value(20)).current
  const tagOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 12,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(nameTranslate, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(onReady, 600)
    })
  }, [])

  return (
    <LinearGradient
      colors={gradients.splash}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={splashStyles.container}
    >
      <View style={splashStyles.content}>
        <Animated.View
          style={[
            splashStyles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={splashStyles.logoIcon}>🥘</Text>
        </Animated.View>

        <Animated.Text
          style={[
            splashStyles.brandName,
            {
              opacity: nameOpacity,
              transform: [{ translateY: nameTranslate }],
            },
          ]}
        >
          FridgeChef
        </Animated.Text>

        <Animated.Text style={[splashStyles.tagline, { opacity: tagOpacity }]}>
          Cook with what you have
        </Animated.Text>
      </View>
    </LinearGradient>
  )
}

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.init)
  const isAuthReady = useAuthStore((s) => s.isReady)
  const initOnboarding = useOnboardingStore((s) => s.init)
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded)
  const [splashDone, setSplashDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initAuth()
    initOnboarding()
  }, [])

  useEffect(() => {
    if (!splashDone || !isAuthReady || hasOnboarded === null) return

    if (!hasOnboarded) {
      router.replace('/onboarding' as any)
    }
  }, [splashDone, isAuthReady, hasOnboarded])

  if (!splashDone) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onReady={() => setSplashDone(true)} />
      </>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="onboarding"
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="session"
            options={{ animation: 'slide_from_bottom' }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 44,
  },
  brandName: {
    fontSize: fonts.sizes.hero,
    fontWeight: fonts.weights.black,
    color: '#FFFFFF',
    letterSpacing: fonts.tracking.tight,
    marginBottom: 8,
  },
  tagline: {
    fontSize: fonts.sizes.bodySmall,
    fontWeight: fonts.weights.regular,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: fonts.tracking.wide,
  },
})
