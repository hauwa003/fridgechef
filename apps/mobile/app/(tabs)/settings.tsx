import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function SettingsScreen() {
  const queryClient = useQueryClient()
  const signOut = useAuthStore((s) => s.signOut)
  const { data } = useQuery('preferences', api.getPreferences)

  const updatePref = useMutation(api.updatePreferences, {
    onSuccess: () => queryClient.invalidateQueries('preferences'),
  })

  const prefs = data?.preferences

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await api.deleteAccount()
            signOut()
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Delete photos after scan</Text>
            <Text style={styles.rowSub}>Recommended for privacy</Text>
          </View>
          <Switch
            value={!prefs?.photo_retention ?? true}
            onValueChange={(val) =>
              updatePref.mutate({ ...prefs, photo_retention: !val })
            }
            trackColor={{ true: '#16a34a' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.rowGroup}>
          {(['metric', 'imperial'] as const).map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.unitButton, prefs?.units === unit && styles.unitButtonActive]}
              onPress={() => updatePref.mutate({ ...prefs, units: unit })}
            >
              <Text style={[styles.unitText, prefs?.units === unit && styles.unitTextActive]}>
                {unit.charAt(0).toUpperCase() + unit.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.destructiveButton]} onPress={handleDeleteAccount}>
          <Text style={styles.destructiveText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', padding: 20, color: '#111827' },
  section: { paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  rowSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  rowGroup: { flexDirection: 'row', gap: 8 },
  unitButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  unitButtonActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  unitText: { fontSize: 14, color: '#374151' },
  unitTextActive: { color: '#fff', fontWeight: '600' },
  button: { paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', marginBottom: 10 },
  buttonText: { fontSize: 15, color: '#374151' },
  destructiveButton: { borderColor: '#fca5a5' },
  destructiveText: { fontSize: 15, color: '#dc2626' },
})
