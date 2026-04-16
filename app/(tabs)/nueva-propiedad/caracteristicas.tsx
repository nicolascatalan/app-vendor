import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import StepIndicator from '@/components/StepIndicator';
import Stepper from '@/components/Stepper';
import { useNuevaPropiedadStore } from '@/store/nuevaPropiedad';

const STEPS = ['Tipo', 'Ubicación', 'Características', 'Fotos', 'Descripción', 'Preview'];

const ANTIGUEDAD_OPTIONS = ['Nuevo', '0-5 años', '5-10 años', '10-20 años', '+20 años'];
const ORIENTACION_OPTIONS = ['Norte', 'Sur', 'Este', 'Oeste', 'Nororiente', 'Norponiente', 'Suroriente', 'Surponiente'];

export default function Paso3Caracteristicas() {
  const router = useRouter();
  const store = useNuevaPropiedadStore();

  const handleContinuar = () => {
    if (!store.superficieTotal) {
      Alert.alert('Requerido', 'Ingresa la superficie total en m².');
      return;
    }
    router.push('/(tabs)/nueva-propiedad/fotos');
  };

  const isDepartamento = store.tipoPropiedad === 'departamento';
  const isArriendo = store.tipoOperacion === 'arriendo';

  return (
    <View style={styles.container}>
      <StepIndicator steps={STEPS} currentStep={2} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Superficies */}
        <Text style={styles.sectionTitle}>Superficies</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Superficie total (m²) *</Text>
            <TextInput
              style={styles.numInput}
              value={store.superficieTotal?.toString() ?? ''}
              onChangeText={(t) => store.setField('superficieTotal', t ? parseFloat(t) : null)}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#bbb"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Superficie útil (m²)</Text>
            <TextInput
              style={styles.numInput}
              value={store.superficieUtil?.toString() ?? ''}
              onChangeText={(t) => store.setField('superficieUtil', t ? parseFloat(t) : null)}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#bbb"
            />
          </View>
        </View>

        {/* Dependencias */}
        <Text style={styles.sectionTitle}>Dependencias</Text>
        <View style={styles.card}>
          <Stepper value={store.dormitorios} min={0} max={10} onChange={(v) => store.setField('dormitorios', v)} label="Dormitorios" icon="🛏️" />
          <Stepper value={store.banos} min={0} max={10} onChange={(v) => store.setField('banos', v)} label="Baños" icon="🚿" />
          <Stepper value={store.estacionamientos} min={0} max={10} onChange={(v) => store.setField('estacionamientos', v)} label="Estacionamientos" icon="🚗" />
          <Stepper value={store.bodegas} min={0} max={5} onChange={(v) => store.setField('bodegas', v)} label="Bodegas" icon="📦" />
        </View>

        {/* Departamento: piso */}
        {isDepartamento && (
          <>
            <Text style={styles.sectionTitle}>Edificio</Text>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Piso</Text>
                <TextInput
                  style={styles.numInput}
                  value={store.piso?.toString() ?? ''}
                  onChangeText={(t) => store.setField('piso', t ? parseInt(t, 10) : null)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#bbb"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>N° pisos del edificio</Text>
                <TextInput
                  style={styles.numInput}
                  value={store.pisosEdificio?.toString() ?? ''}
                  onChangeText={(t) => store.setField('pisosEdificio', t ? parseInt(t, 10) : null)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#bbb"
                />
              </View>
            </View>
          </>
        )}

        {/* Antigüedad */}
        <Text style={styles.sectionTitle}>Antigüedad</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={store.antiguedad ?? ''}
            onValueChange={(v) => store.setField('antiguedad', v || null)}
          >
            <Picker.Item label="Selecciona..." value="" />
            {ANTIGUEDAD_OPTIONS.map((o) => <Picker.Item key={o} label={o} value={o} />)}
          </Picker>
        </View>

        {/* Orientación */}
        <Text style={styles.sectionTitle}>Orientación</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={store.orientacion ?? ''}
            onValueChange={(v) => store.setField('orientacion', v || null)}
          >
            <Picker.Item label="Selecciona..." value="" />
            {ORIENTACION_OPTIONS.map((o) => <Picker.Item key={o} label={o} value={o} />)}
          </Picker>
        </View>

        {/* Arriendo extras */}
        {isArriendo && (
          <>
            <Text style={styles.sectionTitle}>Condiciones de arriendo</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>🛋️ Amoblado</Text>
                <Switch
                  value={store.amoblado}
                  onValueChange={(v) => store.setField('amoblado', v)}
                  trackColor={{ true: '#0033A0' }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>🐾 Mascotas permitidas</Text>
                <Switch
                  value={store.mascotas}
                  onValueChange={(v) => store.setField('mascotas', v)}
                  trackColor={{ true: '#0033A0' }}
                />
              </View>
            </View>
          </>
        )}

        {/* Gastos comunes */}
        <Text style={styles.sectionTitle}>Gastos comunes (CLP/mes) — opcional</Text>
        <TextInput
          style={styles.fullInput}
          value={store.gastosComunes?.toString() ?? ''}
          onChangeText={(t) => store.setField('gastosComunes', t ? parseInt(t, 10) : null)}
          keyboardType="number-pad"
          placeholder="Ej: 80000"
          placeholderTextColor="#bbb"
        />

        {/* Contribuciones */}
        <Text style={styles.sectionTitle}>Contribuciones (CLP/año) — opcional</Text>
        <TextInput
          style={styles.fullInput}
          value={store.contribuciones?.toString() ?? ''}
          onChangeText={(t) => store.setField('contribuciones', t ? parseInt(t, 10) : null)}
          keyboardType="number-pad"
          placeholder="Ej: 500000"
          placeholderTextColor="#bbb"
        />

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
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 0,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputLabel: { fontSize: 15, color: '#333' },
  numInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fafafa',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabel: { fontSize: 15, color: '#333' },
  fullInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
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
