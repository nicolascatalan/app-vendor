import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import StepIndicator from '@/components/StepIndicator';
import { useNuevaPropiedadStore } from '@/store/nuevaPropiedad';

const STEPS = ['Tipo', 'Ubicación', 'Características', 'Fotos', 'Descripción', 'Preview'];

const OPERACIONES = [
  { value: 'venta', label: 'Venta', icon: '🏷️', desc: 'Propiedad en venta' },
  { value: 'arriendo', label: 'Arriendo', icon: '🔑', desc: 'Propiedad para arrendar' },
] as const;

const PROPIEDADES = [
  { value: 'casa', label: 'Casa', icon: '🏠' },
  { value: 'departamento', label: 'Departamento', icon: '🏢' },
  { value: 'loft', label: 'Loft', icon: '🏙️' },
  { value: 'oficina', label: 'Oficina', icon: '💼' },
  { value: 'local', label: 'Local Comercial', icon: '🏪' },
  { value: 'terreno', label: 'Terreno', icon: '🌿' },
  { value: 'bodega', label: 'Bodega', icon: '📦' },
  { value: 'estacionamiento', label: 'Estacionamiento', icon: '🚗' },
  { value: 'parcela', label: 'Parcela', icon: '🌾' },
] as const;

export default function Paso1() {
  const router = useRouter();
  const { tipoOperacion, tipoPropiedad, setField } = useNuevaPropiedadStore();

  const handleContinuar = () => {
    if (!tipoOperacion) {
      Alert.alert('Requerido', 'Selecciona el tipo de operación.');
      return;
    }
    if (!tipoPropiedad) {
      Alert.alert('Requerido', 'Selecciona el tipo de propiedad.');
      return;
    }
    router.push('/(tabs)/nueva-propiedad/ubicacion');
  };

  return (
    <View style={styles.container}>
      <StepIndicator steps={STEPS} currentStep={0} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>¿Qué tipo de operación?</Text>
        <View style={styles.operacionRow}>
          {OPERACIONES.map((op) => (
            <TouchableOpacity
              key={op.value}
              style={[styles.operacionCard, tipoOperacion === op.value && styles.selectedCard]}
              onPress={() => setField('tipoOperacion', op.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.operacionIcon}>{op.icon}</Text>
              <Text style={[styles.operacionLabel, tipoOperacion === op.value && styles.selectedText]}>
                {op.label}
              </Text>
              <Text style={[styles.operacionDesc, tipoOperacion === op.value && styles.selectedDescText]}>
                {op.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>¿Qué tipo de propiedad?</Text>
        <View style={styles.propiedadGrid}>
          {PROPIEDADES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.propiedadCard, tipoPropiedad === p.value && styles.selectedCard]}
              onPress={() => setField('tipoPropiedad', p.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.propiedadIcon}>{p.icon}</Text>
              <Text style={[styles.propiedadLabel, tipoPropiedad === p.value && styles.selectedText]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinuar} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 8 },
  operacionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  operacionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  selectedCard: { borderColor: '#0033A0', backgroundColor: '#f0f3fa' },
  operacionIcon: { fontSize: 36, marginBottom: 8 },
  operacionLabel: { fontSize: 18, fontWeight: '700', color: '#333' },
  selectedText: { color: '#0033A0' },
  operacionDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  selectedDescText: { color: '#3366cc' },
  propiedadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  propiedadCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    padding: 6,
  },
  propiedadIcon: { fontSize: 26 },
  propiedadLabel: { fontSize: 9, color: '#666', textAlign: 'center', marginTop: 4 },
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
  continueBtn: {
    backgroundColor: '#0033A0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
