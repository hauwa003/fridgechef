import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSessionStore } from '@/store/session'
import { uploadImages } from '@/lib/imageUpload'
import { api } from '@/lib/api'

type Stage = 'uploading' | 'extracting' | 'done' | 'error'

export default function ProcessingScreen() {
  const router = useRouter()
  const { photos: photosParam } = useLocalSearchParams<{ photos: string }>()
  const photos: string[] = JSON.parse(photosParam ?? '[]')
  const session = useSessionStore((s) => s.session)
  const setIngredients = useSessionStore((s) => s.setIngredients)

  const [stage, setStage] = useState<Stage>('uploading')
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: photos.length })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [pulseAnim])

  useEffect(() => {
    if (!session) return
    run()
  }, [])

  async function run() {
    if (!session) return

    try {
      // Step 1: Upload
      setStage('uploading')
      await uploadImages(session.id, photos, (current, total) => {
        setUploadProgress({ current, total })
      })

      // Step 2: Extract
      setStage('extracting')
      const { ingredients, warnings } = await api.extractIngredients(session.id)
      setIngredients(ingredients, warnings)

      setStage('done')
      router.replace('/session/ingredients')
    } catch (err: any) {
      setStage('error')
      if (err.code === 'EXTRACTION_FAILED') {
        setErrorMessage("We couldn't scan the photo. Try better lighting.")
      } else if (err.code === 'UPLOAD_FAILED' || err.status >= 500) {
        setErrorMessage('Upload failed. Check your connection and try again.')
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }
    }
  }

  const stageLabel: Record<Stage, string> = {
    uploading: `Uploading photo${uploadProgress.total > 1 ? 's' : ''}… (${uploadProgress.current}/${uploadProgress.total})`,
    extracting: 'Scanning your fridge…',
    done: 'Done!',
    error: 'Something went wrong',
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {stage !== 'error' ? (
          <>
            <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.icon}>
                {stage === 'uploading' ? '📤' : stage === 'extracting' ? '🔍' : '✅'}
              </Text>
            </Animated.View>
            <Text style={styles.stageText}>{stageLabel[stage]}</Text>

            {stage === 'uploading' && (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(uploadProgress.current / Math.max(uploadProgress.total, 1)) * 100}%`,
                    },
                  ]}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.replace('/session/capture')}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Oops</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>

            <TouchableOpacity style={styles.retryButton} onPress={run}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => router.replace('/session/ingredients')}
            >
              <Text style={styles.manualText}>Type ingredients manually</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconWrap: { marginBottom: 24 },
  icon: { fontSize: 64 },
  stageText: { fontSize: 18, fontWeight: '500', color: '#374151', marginBottom: 24, textAlign: 'center' },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 3 },
  cancelButton: { marginTop: 16 },
  cancelText: { color: '#9ca3af', fontSize: 14 },
  errorIcon: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  manualButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
  },
  manualText: { color: '#374151', fontSize: 15 },
})
