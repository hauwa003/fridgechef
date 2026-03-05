import { useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from 'react-query'
import { useSessionStore } from '@/store/session'
import { api } from '@/lib/api'
import type { Recipe } from '@fridgechef/shared'

export default function PastSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const setRecipes = useSessionStore((s) => s.setRecipes)

  const { data, isLoading } = useQuery(['session', id], () =>
    api.getSession(id)
  )

  useEffect(() => {
    if (data?.session?.recipes) {
      setRecipes(data.session.recipes)
    }
  }, [data, setRecipes])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#16a34a" style={styles.loader} />
      </SafeAreaView>
    )
  }

  const session = data?.session
  const recipes: Recipe[] = session?.recipes ?? []
  const date = session ? new Date(session.created_at).toLocaleDateString() : ''

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Session · {date}</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/session/recipe/[id]', params: { id: item.id } })
            }
          >
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              {item.cook_time_minutes} min · Uses {item.uses.length} ingredients
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No recipes in this session.</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, marginTop: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  back: { fontSize: 15, color: '#16a34a' },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 },
  rank: { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardMeta: { fontSize: 13, color: '#6b7280' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6b7280' },
})
