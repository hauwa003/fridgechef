import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSessionStore } from '@/store/session'
import type { Recipe } from '@fridgechef/shared'

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: '#16a34a',
    medium: '#d97706',
    hard: '#dc2626',
  }
  const color = colors[difficulty] ?? '#6b7280'
  return (
    <View style={[styles.badge, { backgroundColor: color + '18' }]}>
      <Text style={[styles.badgeText, { color }]}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Text>
    </View>
  )
}

function RecipeCard({
  recipe,
  rank,
  onPress,
}: {
  recipe: Recipe
  rank: number
  onPress: () => void
}) {
  const totalIngredients = recipe.uses.length + recipe.missing.length
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.rank}>#{rank}</Text>
        <DifficultyBadge difficulty={recipe.difficulty} />
      </View>
      <Text style={styles.cardTitle}>{recipe.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {recipe.description}
      </Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaItem}>⏱ {recipe.cook_time_minutes} min</Text>
        <Text style={styles.metaItem}>👤 {recipe.servings}</Text>
        <Text style={[styles.metaItem, styles.metaGreen]}>
          ✓ {recipe.uses.length}/{totalIngredients} ingredients
        </Text>
        {recipe.missing.length > 0 && (
          <Text style={[styles.metaItem, styles.metaAmber]}>
            + {recipe.missing.length} needed
          </Text>
        )}
      </View>
      {recipe.source === 'fallback' && (
        <Text style={styles.fallbackNote}>Suggested recipe</Text>
      )}
    </TouchableOpacity>
  )
}

export default function RecipesScreen() {
  const router = useRouter()
  const recipes = useSessionStore((s) => s.recipes)
  const session = useSessionStore((s) => s.session)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recipes</Text>
        <Text style={styles.count}>{recipes.length} found</Text>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <RecipeCard
            recipe={item}
            rank={index + 1}
            onPress={() =>
              router.push({
                pathname: '/session/recipe/[id]',
                params: { id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No recipes generated.</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.emptyAction}>Go back and try again</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  back: { fontSize: 15, color: '#16a34a' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  count: { fontSize: 14, color: '#6b7280' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rank: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { fontSize: 13, color: '#6b7280' },
  metaGreen: { color: '#16a34a', fontWeight: '500' },
  metaAmber: { color: '#d97706', fontWeight: '500' },
  fallbackNote: { marginTop: 8, fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', marginBottom: 12 },
  emptyAction: { fontSize: 15, color: '#16a34a', fontWeight: '500' },
})
