import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from 'react-query'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'

export default function HistoryScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery('history', api.getHistory)

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    )
  }

  const sessions = data?.sessions ?? []

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>History</Text>
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No scans yet.</Text>
          <Text style={styles.emptySubtext}>Your past scans will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const activeIngredients = item.ingredients?.filter((i: any) => i.is_active) ?? []
            const date = new Date(item.created_at).toLocaleDateString()
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/session/${item.id}`)}
              >
                <Text style={styles.cardDate}>{date}</Text>
                <Text style={styles.cardIngredients}>
                  {activeIngredients.slice(0, 4).map((i: any) => i.name).join(', ')}
                  {activeIngredients.length > 4 ? ` +${activeIngredients.length - 4} more` : ''}
                </Text>
                <Text style={styles.cardRecipes}>{item.recipes?.length ?? 0} recipes</Text>
              </TouchableOpacity>
            )
          }}
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
  cardDate: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  cardIngredients: { fontSize: 15, fontWeight: '500', color: '#111827', marginBottom: 4 },
  cardRecipes: { fontSize: 13, color: '#16a34a' },
})
