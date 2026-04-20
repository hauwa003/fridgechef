import { View, Text, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from 'react-query'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { colors, fonts, spacing, radius, shadows } from '@/lib/theme'
import { FadeIn, ScalePress, Pulse, BounceIn } from '@/lib/animations'

export default function SavedScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery('saved', api.getSavedRecipes)

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Pulse>
            <View style={styles.loadingCircle}>
              <Text style={styles.loadingEmoji}>🔖</Text>
            </View>
          </Pulse>
        </View>
      </SafeAreaView>
    )
  }

  const saved = data?.saved ?? []

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeIn delay={50} from="top" distance={12}>
        <View style={styles.headerSection}>
          <Text style={styles.header}>Saved Recipes</Text>
          {saved.length > 0 && (
            <BounceIn delay={200}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{saved.length}</Text>
              </View>
            </BounceIn>
          )}
        </View>
      </FadeIn>

      {saved.length === 0 ? (
        <FadeIn delay={200} distance={30}>
          <View style={styles.empty}>
            <BounceIn delay={400}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>♡</Text>
              </View>
            </BounceIn>
            <Text style={styles.emptyText}>No saved recipes yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the bookmark on any recipe{'\n'}to save it for later
            </Text>
          </View>
        </FadeIn>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeIn delay={100 + index * 60} distance={16}>
              <ScalePress
                scale={0.98}
                haptic="light"
                onPress={() => router.push(`/session/recipe/${item.recipe_id}`)}
                style={styles.card}
              >
                <View style={styles.cardAccent} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.recipe.title}</Text>
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardMeta}>
                      {item.recipe.cook_time_minutes} min
                    </Text>
                    <View style={styles.metaDot} />
                    <Text style={[styles.cardMeta, styles.cardDifficulty]}>
                      {item.recipe.difficulty}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </ScalePress>
            </FadeIn>
          )}
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
    backgroundColor: colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: { fontSize: 32 },

  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    fontSize: fonts.sizes.h1,
    fontWeight: fonts.weights.black,
    color: colors.textPrimary,
    letterSpacing: fonts.tracking.snug,
  },
  headerBadge: {
    backgroundColor: colors.primaryPale,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  headerBadgeText: {
    fontSize: fonts.sizes.bodySmall,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
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
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.card,
  },
  cardAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
  },
  cardContent: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  cardTitle: {
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardMeta: {
    fontSize: fonts.sizes.bodySmall,
    color: colors.textTertiary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
  },
  cardDifficulty: {
    textTransform: 'capitalize',
  },
  cardArrow: {
    fontSize: 22,
    color: colors.textTertiary,
    paddingRight: spacing.lg,
    fontWeight: fonts.weights.light,
  },
})
