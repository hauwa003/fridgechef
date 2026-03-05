import { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSessionStore } from '@/store/session'
import { MAX_IMAGES_PER_SESSION } from '@fridgechef/shared'

export default function CaptureScreen() {
  const router = useRouter()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [photos, setPhotos] = useState<string[]>([])
  const [facing] = useState<CameraType>('back')
  const session = useSessionStore((s) => s.session)

  const canAddMore = photos.length < MAX_IMAGES_PER_SESSION

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || !canAddMore) return
    const photo = await cameraRef.current.takePictureAsync({ quality: 1 })
    if (photo) setPhotos((prev) => [...prev, photo.uri])
  }, [canAddMore])

  const pickFromGallery = useCallback(async () => {
    if (!canAddMore) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES_PER_SESSION - photos.length,
      quality: 1,
    })
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri)
      setPhotos((prev) => [...prev, ...uris].slice(0, MAX_IMAGES_PER_SESSION))
    }
  }, [canAddMore, photos.length])

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleContinue = useCallback(() => {
    if (photos.length === 0) {
      Alert.alert('No photos', 'Take at least one photo of your fridge.')
      return
    }
    if (!session) {
      Alert.alert('Error', 'No active session. Go back and try again.')
      return
    }
    router.push({ pathname: '/session/processing', params: { photos: JSON.stringify(photos) } })
  }, [photos, session, router])

  if (!permission) return <View style={styles.container} />

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            FridgeChef needs camera access to scan your fridge.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Guidance overlay */}
        <View style={styles.overlay}>
          <View style={styles.guidancePills}>
            {['Good lighting', 'Capture shelves clearly', 'Avoid glare'].map((tip) => (
              <View key={tip} style={styles.pill}>
                <Text style={styles.pillText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </CameraView>

      {/* Bottom controls */}
      <SafeAreaView edges={['bottom']} style={styles.controls}>
        {/* Photo strip */}
        {photos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoStrip}
            contentContainerStyle={styles.photoStripContent}
          >
            {photos.map((uri, index) => (
              <View key={uri} style={styles.thumbnail}>
                <Image source={{ uri }} style={styles.thumbnailImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.buttonRow}>
          {/* Back */}
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.iconButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Shutter */}
          <TouchableOpacity
            style={[styles.shutter, !canAddMore && styles.shutterDisabled]}
            onPress={takePhoto}
            disabled={!canAddMore}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity
            style={[styles.iconButton, !canAddMore && styles.iconButtonDisabled]}
            onPress={pickFromGallery}
            disabled={!canAddMore}
          >
            <Text style={styles.iconButtonText}>🖼</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.photoCount}>
          {photos.length}/{MAX_IMAGES_PER_SESSION} photos
        </Text>

        {photos.length > 0 && (
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue →</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  guidancePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { color: '#fff', fontSize: 12 },
  controls: { backgroundColor: '#111', paddingHorizontal: 20, paddingTop: 12 },
  photoStrip: { maxHeight: 80, marginBottom: 12 },
  photoStripContent: { gap: 8, paddingHorizontal: 4 },
  thumbnail: { width: 64, height: 64, borderRadius: 8, overflow: 'visible' },
  thumbnailImage: { width: 64, height: 64, borderRadius: 8 },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: { opacity: 0.3 },
  iconButtonText: { fontSize: 20 },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.3 },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  photoCount: { color: '#9ca3af', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  continueButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  permissionText: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  primaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
