import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import StepIndicator from '@/components/StepIndicator';
import PhotoGrid from '@/components/PhotoGrid';
import { useNuevaPropiedadStore } from '@/store/nuevaPropiedad';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useAuth } from '@/hooks/useAuth';
import { uploadPhoto } from '@/services/portalInmobiliario';

const STEPS = ['Tipo', 'Ubicación', 'Características', 'Fotos', 'Descripción', 'Preview'];
const MIN_FOTOS = 3;
const MAX_FOTOS = 20;

export default function Paso4Fotos() {
  const router = useRouter();
  const { fotos, addFoto, removeFoto, reorderFotos, updateFotoMlId, setFotoUploading, setFotoUploadError } =
    useNuevaPropiedadStore();
  const { pickFromGallery, pickFromCamera } = useImagePicker();
  const { getAccessToken, refreshAccessToken } = useAuth();
  const [globalUploading, setGlobalUploading] = useState(false);

  const uploadSinglePhoto = async (uri: string) => {
    setFotoUploading(uri, true);
    setFotoUploadError(uri, false);
    let token = await getAccessToken();
    if (!token) return;

    try {
      const mlId = await uploadPhoto(uri, token);
      updateFotoMlId(uri, mlId);
    } catch (e: any) {
      if (e.message === 'TOKEN_EXPIRED') {
        const newToken = await refreshAccessToken();
        if (newToken) {
          try {
            const mlId = await uploadPhoto(uri, newToken);
            updateFotoMlId(uri, mlId);
            return;
          } catch {}
        }
      }
      setFotoUploadError(uri, true);
    } finally {
      setFotoUploading(uri, false);
    }
  };

  const addAndUpload = async (uris: string[]) => {
    const available = MAX_FOTOS - fotos.length;
    const toAdd = uris.slice(0, available);
    for (const uri of toAdd) {
      addFoto({ uri });
      uploadSinglePhoto(uri);
    }
  };

  const handleGallery = async () => {
    try {
      const picked = await pickFromGallery();
      await addAndUpload(picked.map((p) => p.uri));
    } catch (e: any) {
      Alert.alert('Permiso requerido', e.message);
    }
  };

  const handleCamera = async () => {
    try {
      const picked = await pickFromCamera();
      if (picked) await addAndUpload([picked.uri]);
    } catch (e: any) {
      Alert.alert('Permiso requerido', e.message);
    }
  };

  const retryAll = async () => {
    const failed = fotos.filter((f) => f.uploadError);
    for (const f of failed) {
      uploadSinglePhoto(f.uri);
    }
  };

  const uploadedCount = fotos.filter((f) => f.mlId).length;
  const failedCount = fotos.filter((f) => f.uploadError).length;
  const progress = fotos.length > 0 ? uploadedCount / fotos.length : 0;

  const canContinue = uploadedCount >= MIN_FOTOS;

  return (
    <View style={styles.container}>
      <StepIndicator steps={STEPS} currentStep={3} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Contadores */}
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            {uploadedCount} de {MIN_FOTOS} fotos mínimas
          </Text>
          <Text style={styles.counterTotal}>{fotos.length}/{MAX_FOTOS}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(uploadedCount / MIN_FOTOS, 1) * 100}%` }]} />
        </View>
        {uploadedCount >= MIN_FOTOS && (
          <Text style={styles.okText}>✅ Mínimo alcanzado — puedes continuar</Text>
        )}
        {failedCount > 0 && (
          <TouchableOpacity style={styles.retryBtn} onPress={retryAll}>
            <Text style={styles.retryBtnText}>⚠️ {failedCount} foto(s) fallaron — Reintentar</Text>
          </TouchableOpacity>
        )}

        {/* Botones de acción */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCamera} activeOpacity={0.8}>
            <Text style={styles.actionBtnIcon}>📷</Text>
            <Text style={styles.actionBtnText}>Tomar foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleGallery} activeOpacity={0.8}>
            <Text style={styles.actionBtnIcon}>🖼️</Text>
            <Text style={styles.actionBtnText}>Elegir de galería</Text>
          </TouchableOpacity>
        </View>

        {/* Grid de fotos */}
        {fotos.length > 0 && (
          <>
            <Text style={styles.gridHint}>La primera foto es la portada. Usa ◀▶ para reordenar.</Text>
            <PhotoGrid
              photos={fotos}
              onReorder={reorderFotos}
              onDelete={removeFoto}
              onAdd={handleGallery}
            />
          </>
        )}

        {fotos.length === 0 && (
          <View style={styles.emptyPhotos}>
            <Text style={styles.emptyPhotosIcon}>📸</Text>
            <Text style={styles.emptyPhotosText}>Agrega al menos {MIN_FOTOS} fotos para continuar</Text>
            <Text style={styles.emptyPhotosHint}>Recomendado: 10+ fotos horizontales, sin marca de agua</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={() => canContinue && router.push('/(tabs)/nueva-propiedad/descripcion')}
          activeOpacity={canContinue ? 0.85 : 1}
        >
          <Text style={styles.continueBtnText}>
            {canContinue ? 'Continuar →' : `Mínimo ${MIN_FOTOS} fotos`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 16, paddingBottom: 100 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  counterText: { fontSize: 14, color: '#333', fontWeight: '600' },
  counterTotal: { fontSize: 14, color: '#999' },
  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0033A0', borderRadius: 3 },
  okText: { fontSize: 13, color: '#22c55e', fontWeight: '600', marginBottom: 8 },
  retryBtn: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  retryBtnText: { color: '#92400e', fontWeight: '600', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0033A0',
    gap: 6,
  },
  actionBtnIcon: { fontSize: 28 },
  actionBtnText: { fontSize: 13, color: '#0033A0', fontWeight: '600' },
  gridHint: { fontSize: 11, color: '#999', marginBottom: 10, textAlign: 'center' },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyPhotosIcon: { fontSize: 56 },
  emptyPhotosText: { fontSize: 15, color: '#555', fontWeight: '600', textAlign: 'center' },
  emptyPhotosHint: { fontSize: 12, color: '#999', textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  continueBtn: { backgroundColor: '#0033A0', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: '#aab4d4' },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
