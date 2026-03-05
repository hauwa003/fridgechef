import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from 'react-query'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'

export default function SavedScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery('saved', api.getSavedRecipes)

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    )
  }

  const saved = data?.saved ?? []

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Saved Recipes</Text>
      {saved.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No saved recipes yet.</Text>
          <Text style={styles.emptySubtext}>Save recipes you want to cook again.</Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/session/recipe/${item.recipe_id}`)}
            >
              <Text style={styles.cardTitle}>{item.recipe.title}</Text>
              <Text style={styles.cardMeta}>{item.recipe.cook_time_minutes} min · {item.recipe.difficulty}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', padding: 20, color: '#111827' },
  loading: { padding: 20, color: '#6b7280' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#6b7280' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardMeta: { fontSize: 13, color: '#6b7280' },
})
