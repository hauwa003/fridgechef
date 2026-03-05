import { Stack } from 'expo-router'

export default function SessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="processing" />
      <Stack.Screen name="ingredients" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="recipes" />
      <Stack.Screen name="recipe/[id]" />
      <Stack.Screen name="cook/[id]" />
    </Stack>
  )
}
