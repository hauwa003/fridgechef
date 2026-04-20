import { View, Text, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from 'react-query'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { colors, fonts, spacing, radius, shadows } from '@/lib/theme'
import { FadeIn, ScalePress, Pulse, BounceIn } from '@/lib/animations'

export default function HistoryScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery('history', api.getHistory)

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Pulse>
            <View style={styles.loadingCircle}>
              <Text style={styles.loadingEmoji}>🕐</Text>
            </View>
          </Pulse>
        </View>
      </SafeAreaView>
    )
  }

  const sessions = data?.sessions ?? []

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeIn delay={50} from="top" distance={12}>
        <View style={styles.headerSection}>
          <Text style={styles.header}>History</Text>
        </View>
      </FadeIn>

      {sessions.length === 0 ? (
        <FadeIn delay={200} distance={30}>
          <View style={styles.empty}>
            <BounceIn delay={400}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>↻</Text>
              </View>
            </BounceIn>
            <Text style={styles.emptyText}>No scans yet</Text>
            <Text style={styles.emptySubtext}>
              Your past fridge scans{'\n'}will appear here
            </Text>
          </View>
        </FadeIn>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const activeIngredients =
              item.ingredients?.filter((i: any) => i.is_active) ?? []
            const date = new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const recipeCount = item.recipes?.length ?? 0

            return (
              <FadeIn delay={100 + index * 60} distance={16}>
                <ScalePress
                  scale={0.98}
                  haptic="light"
                  onPress={() => router.push(`/session/${item.id}`)}
                  style={styles.card}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardDate}>{date}</Text>
                    {recipeCount > 0 && (
                      <View style={styles.recipeBadge}>
                        <Text style={styles.recipeBadgeText}>
                          {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardIngredients} numberOfLines={2}>
                    {activeIngredients
                      .slice(0, 5)
                      .map((i: any) => i.name)
                      .join(', ')}
                    {activeIngredients.length > 5
                      ? ` +${activeIngredients.length - 5}`
                      : ''}
                  </Text>
                </ScalePress>
              </FadeIn>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: { fontSize: 32 },

  headerSection: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  header: {
    fontSize: fonts.sizes.h1,
    fontWeight: fonts.weights.black,
    color: colors.textPrimary,
    letterSpacing: fonts.tracking.snug,
  },

  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyEmoji: {
    fontSize: 34,
    color: colors.textTertiary,
  },
  emptyText: {
    fontSize: fonts.sizes.h3,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fonts.sizes.body,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: fonts.sizes.body * fonts.lineHeights.relaxed,
  },

  list: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardDate: {
    fontSize: fonts.sizes.caption,
    fontWeight: fonts.weights.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: fonts.tracking.wide,
  },
  recipeBadge: {
    backgroundColor: colors.primaryPale,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  recipeBadgeText: {
    fontSize: fonts.sizes.label,
    fontWeight: fonts.weights.semibold,
    color: colors.primary,
  },
  cardIngredients: {
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.medium,
    color: colors.textPrimary,
    lineHeight: fonts.sizes.body * fonts.lineHeights.normal,
    textTransform: 'capitalize',
  },
})
