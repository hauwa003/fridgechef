/**
 * FridgeChef — "Warm Editorial" Design Theme
 *
 * Modern, magazine-inspired palette with warm naturals,
 * deep botanical greens, and rich terracotta.
 * Designed for human photography backgrounds with glass overlays.
 */

export const colors = {
  // ─── Backgrounds ──────────────────────────────────────────
  bg: '#FAFAF7',           // warm off-white — primary surface
  bgCard: '#FFFFFF',       // white cards
  bgElevated: '#F5F2ED',   // subtle warm cream for sections
  bgMuted: '#EFEAE3',      // muted cream for inactive areas
  bgDark: '#1A1814',       // near-black warm — for dark overlays

  // ─── Primary — Botanical Green ────────────────────────────
  primary: '#1B5E3B',       // deep rich green
  primaryLight: '#2D8A5E',  // vibrant green
  primaryPale: '#D4EDDA',   // light green tint
  primaryGhost: '#EDF5F0',  // barely-there green bg
  primaryMuted: '#A8D5BA',  // soft sage

  // ─── Accent — Terracotta ──────────────────────────────────
  accent: '#C44D2B',        // warm terracotta
  accentLight: '#E8725A',   // lighter terracotta
  accentPale: '#FEF0EC',    // pale terracotta bg
  accentWarm: '#E89B5A',    // golden amber

  // ─── Text ─────────────────────────────────────────────────
  textPrimary: '#1A1814',   // near-black, warm
  textSecondary: '#5C564D', // warm mid-gray
  textTertiary: '#9A948B',  // warm light gray
  textInverse: '#FFFFFF',
  textOnImage: '#FFFFFF',

  // ─── Semantic ─────────────────────────────────────────────
  success: '#2D8A5E',
  warning: '#D4A054',
  warningBg: '#FDF6E8',
  warningText: '#8B6914',
  error: '#C44D2B',
  errorBg: '#FEF0EC',

  // ─── Borders & Dividers ───────────────────────────────────
  border: '#E8E3DB',
  borderLight: '#F0EBE3',
  divider: '#EDE8DF',

  // ─── Overlays ─────────────────────────────────────────────
  overlay: 'rgba(26, 24, 20, 0.45)',
  overlayLight: 'rgba(26, 24, 20, 0.25)',
  overlayHeavy: 'rgba(26, 24, 20, 0.65)',
  glass: 'rgba(255, 255, 255, 0.85)',
  glassDark: 'rgba(26, 24, 20, 0.75)',
} as const

export const gradients = {
  primary: ['#1B5E3B', '#145232'] as [string, string],
  primarySoft: ['#2D8A5E', '#1B5E3B'] as [string, string],
  warm: ['#E89B5A', '#C44D2B'] as [string, string],
  hero: ['transparent', 'rgba(26, 24, 20, 0.7)'] as [string, string],
  heroFull: ['rgba(26, 24, 20, 0.15)', 'rgba(26, 24, 20, 0.75)'] as [string, string],
  card: ['rgba(26, 24, 20, 0.0)', 'rgba(26, 24, 20, 0.5)'] as [string, string],
  splash: ['#1B5E3B', '#0F3D27'] as [string, string],
} as const

export const fonts = {
  sizes: {
    display: 44,   // splash, onboarding headlines
    hero: 36,      // big impact headlines
    h1: 28,        // screen titles
    h2: 22,        // section headers
    h3: 18,        // card titles
    body: 16,      // main body text
    bodySmall: 14, // secondary body
    caption: 12,   // captions, labels
    label: 11,     // tiny labels, badges
  },
  weights: {
    black: '900' as const,
    bold: '700' as const,
    semibold: '600' as const,
    medium: '500' as const,
    regular: '400' as const,
    light: '300' as const,
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.45,
    relaxed: 1.6,
  },
  tracking: {
    tight: -1.5,
    snug: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.2,
  },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 100,
} as const

export const shadows = {
  card: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  soft: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  hero: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: {
    shadowColor: '#1B5E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
} as const

// ─── Image Assets (Unsplash — replace with bundled assets for production) ────
export const images = {
  onboarding1: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  onboarding2: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80',
  onboarding3: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
  homeHero: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=900&q=80',
  homeScan: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&q=80',
  homeType: 'https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=600&q=80',
} as const
