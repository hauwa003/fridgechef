/**
 * Reusable micro-animation primitives for FridgeChef.
 *
 * Built on React Native's Animated API — zero extra native deps.
 */
import React, { useEffect, useRef, useCallback } from 'react'
import {
  Animated,
  Pressable,
  type ViewStyle,
  type StyleProp,
  type PressableProps,
} from 'react-native'
import * as Haptics from 'expo-haptics'

// ─── Fade + Slide In ────────────────────────────────────────────────────────

type FadeInProps = {
  delay?: number
  duration?: number
  from?: 'bottom' | 'top' | 'left' | 'right' | 'none'
  distance?: number
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

export function FadeIn({
  delay = 0,
  duration = 400,
  from = 'bottom',
  distance = 18,
  style,
  children,
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const translate = useRef(new Animated.Value(distance)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const translateProp =
    from === 'bottom' || from === 'top'
      ? { translateY: from === 'top' ? Animated.multiply(translate, -1) : translate }
      : from === 'left' || from === 'right'
      ? { translateX: from === 'left' ? Animated.multiply(translate, -1) : translate }
      : {}

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: from !== 'none' ? [translateProp as any] : [],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

// ─── Stagger Group ──────────────────────────────────────────────────────────

type StaggerProps = {
  interval?: number
  baseDelay?: number
  from?: FadeInProps['from']
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function Stagger({
  interval = 60,
  baseDelay = 100,
  from = 'bottom',
  children,
  style,
}: StaggerProps) {
  return (
    <Animated.View style={style}>
      {React.Children.map(children, (child, i) => (
        <FadeIn delay={baseDelay + i * interval} from={from}>
          {child}
        </FadeIn>
      ))}
    </Animated.View>
  )
}

// ─── Scale Press ────────────────────────────────────────────────────────────

type ScalePressProps = PressableProps & {
  scale?: number
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none'
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

export function ScalePress({
  scale = 0.97,
  haptic = 'light',
  style,
  children,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: ScalePressProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: scale,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start()
      onPressIn?.(e)
    },
    [scale, onPressIn]
  )

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }).start()
      onPressOut?.(e)
    },
    [onPressOut]
  )

  const handlePress = useCallback(
    (e: any) => {
      if (haptic === 'selection') {
        Haptics.selectionAsync()
      } else if (haptic !== 'none') {
        const impact =
          haptic === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : haptic === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light
        Haptics.impactAsync(impact)
      }
      onPress?.(e)
    },
    [haptic, onPress]
  )

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}

// ─── Pulse ──────────────────────────────────────────────────────────────────

type PulseProps = {
  duration?: number
  minOpacity?: number
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

export function Pulse({ duration = 1200, minOpacity = 0.4, style, children }: PulseProps) {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: minOpacity,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>
}

// ─── Bounce In ──────────────────────────────────────────────────────────────

type BounceInProps = {
  delay?: number
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

export function BounceIn({ delay = 0, style, children }: BounceInProps) {
  const scale = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        speed: 12,
        bounciness: 15,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  )
}

// ─── Floating (gentle hover) ────────────────────────────────────────────────

type FloatingProps = {
  amplitude?: number
  duration?: number
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

export function Floating({
  amplitude = 6,
  duration = 3000,
  style,
  children,
}: FloatingProps) {
  const translateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -amplitude,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: amplitude,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  )
}

// ─── Spin ───────────────────────────────────────────────────────────────────

type SpinProps = {
  duration?: number
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

export function Spin({ duration = 2000, style, children }: SpinProps) {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [])

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <Animated.View style={[style, { transform: [{ rotate }] }]}>
      {children}
    </Animated.View>
  )
}

// ─── Progress Bar (animated width) ──────────────────────────────────────────

type AnimatedProgressProps = {
  progress: number // 0–100
  height?: number
  color?: string
  bgColor?: string
  style?: StyleProp<ViewStyle>
}

export function AnimatedProgress({
  progress,
  height = 3,
  color,
  bgColor,
  style,
}: AnimatedProgressProps) {
  const width = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(width, {
      toValue: progress,
      useNativeDriver: false, // width animation needs layout
      speed: 12,
      bounciness: 4,
    }).start()
  }, [progress])

  return (
    <Animated.View
      style={[
        {
          height,
          backgroundColor: bgColor ?? '#E8E2D9',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: color ?? '#2D6A4F',
          borderRadius: 2,
          width: width.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </Animated.View>
  )
}
