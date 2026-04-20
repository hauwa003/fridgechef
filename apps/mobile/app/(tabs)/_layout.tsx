import { Tabs } from 'expo-router'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { colors, fonts } from '@/lib/theme'

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: '⬤', inactive: '○' },
  Saved: { active: '♥', inactive: '♡' },
  History: { active: '◷', inactive: '◷' },
  Settings: { active: '⚙', inactive: '⚙' },
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons = TAB_ICONS[label] ?? { active: '•', inactive: '•' }
  return (
    <View style={styles.tabItem}>
      <Text
        style={[
          styles.tabIcon,
          {
            color: focused ? colors.primary : colors.textTertiary,
            fontWeight: focused ? '600' : '300',
          },
        ]}
      >
        {focused ? icons.active : icons.inactive}
      </Text>
      {focused && <View style={styles.tabIndicator} />}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 68,
          ...Platform.select({
            ios: {
              shadowColor: '#1A1814',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            },
            android: { elevation: 8 },
          }),
        },
        tabBarLabelStyle: {
          fontSize: fonts.sizes.label,
          fontWeight: fonts.weights.medium,
          marginTop: 3,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => <TabIcon label="Saved" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon label="History" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
})
