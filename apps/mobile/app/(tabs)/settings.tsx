import { View, Text, Switch, StyleSheet, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import * as Haptics from 'expo-haptics'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { colors, fonts, spacing, radius, shadows } from '@/lib/theme'
import { FadeIn, ScalePress } from '@/lib/animations'

export default function SettingsScreen() {
  const queryClient = useQueryClient()
  const signOut = useAuthStore((s) => s.signOut)
  const { data } = useQuery('preferences', api.getPreferences)

  const updatePref = useMutation(api.updatePreferences, {
    onSuccess: () => queryClient.invalidateQueries('preferences'),
  })

  const prefs = data?.preferences

  function handleDeleteAccount() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FadeIn delay={50} from="top" distance={12}>
          <View style={styles.headerSection}>
            <Text style={styles.header}>Settings</Text>
          </View>
        </FadeIn>

        {/* Privacy */}
        <FadeIn delay={150} distance={14}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Delete photos after scan</Text>
                  <Text style={styles.rowSub}>Recommended for privacy</Text>
                </View>
                <Switch
                  value={!(prefs?.photo_retention ?? false)}
                  onValueChange={(val) => {
                    Haptics.selectionAsync()
                    updatePref.mutate({ ...prefs, photo_retention: !val })
                  }}
                  trackColor={{
                    false: colors.bgMuted,
                    true: colors.primaryLight,
                  }}
                  thumbColor={colors.bgCard}
                />
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Units */}
        <FadeIn delay={250} distance={14}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Units</Text>
            <View style={styles.unitRow}>
              {(['metric', 'imperial'] as const).map((unit) => {
                const active = prefs?.units === unit
                return (
                  <ScalePress
                    key={unit}
                    scale={0.95}
                    haptic="selection"
                    onPress={() =>
                      updatePref.mutate({ ...prefs, units: unit })
                    }
                    style={[
                      styles.unitButton,
                      active && styles.unitButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        active && styles.unitTextActive,
                      ]}
                    >
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </Text>
                  </ScalePress>
                )
              })}
            </View>
          </View>
        </FadeIn>

        {/* Account */}
        <FadeIn delay={350} distance={14}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <ScalePress
              scale={0.98}
              haptic="light"
              onPress={signOut}
              style={styles.accountButton}
            >
              <Text style={styles.accountButtonText}>Sign Out</Text>
            </ScalePress>
            <ScalePress
              scale={0.98}
              haptic="medium"
              onPress={handleDeleteAccount}
              style={[styles.accountButton, styles.destructiveButton]}
            >
              <Text style={styles.destructiveText}>Delete Account</Text>
            </ScalePress>
          </View>
        </FadeIn>

        {/* App Info */}
        <FadeIn delay={450} from="none">
          <View style={styles.appInfo}>
            <Text style={styles.appName}>FridgeChef</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

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

  section: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.caption,
    fontWeight: fonts.weights.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: fonts.tracking.wider,
    marginBottom: spacing.md,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowContent: { flex: 1, marginRight: spacing.lg },
  rowLabel: {
    fontSize: fonts.sizes.body,
    color: colors.textPrimary,
    fontWeight: fonts.weights.medium,
  },
  rowSub: {
    fontSize: fonts.sizes.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },

  unitRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  unitButton: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.soft,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitText: {
    fontSize: fonts.sizes.body,
    color: colors.textSecondary,
    fontWeight: fonts.weights.medium,
  },
  unitTextActive: {
    color: colors.textInverse,
    fontWeight: fonts.weights.semibold,
  },

  accountButton: {
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.soft,
  },
  accountButtonText: {
    fontSize: fonts.sizes.body,
    color: colors.textPrimary,
    fontWeight: fonts.weights.medium,
  },
  destructiveButton: {
    borderColor: colors.accentPale,
    backgroundColor: colors.accentPale,
  },
  destructiveText: {
    fontSize: fonts.sizes.body,
    color: colors.accent,
    fontWeight: fonts.weights.semibold,
  },

  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingBottom: spacing.huge,
  },
  appName: {
    fontSize: fonts.sizes.bodySmall,
    fontWeight: fonts.weights.semibold,
    color: colors.textTertiary,
    letterSpacing: fonts.tracking.wide,
  },
  appVersion: {
    fontSize: fonts.sizes.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
})
