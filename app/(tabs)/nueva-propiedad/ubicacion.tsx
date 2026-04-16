import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import StepIndicator from '@/components/StepIndicator';
import MapPicker from '@/components/MapPicker';
import { useNuevaPropiedadStore } from '@/store/nuevaPropiedad';
import comunasData from '@/data/comunas-chile.json';

const STEPS = ['Tipo', 'Ubicación', 'Características', 'Fotos', 'Descripción', 'Preview'];

export default function Paso2Ubicacion() {
  const router = useRouter();
  const { region, comuna, direccion, lat, lng, setField } = useNuevaPropiedadStore();

  const selectedRegionData = comunasData.find((r) => r.region === region);
  const comunas = selectedRegionData?.comunas ?? [];

  const handleContinuar = () => {
    if (!region) { Alert.alert('Requerido', 'Selecciona una región.'); return; }
    if (!comuna) { Alert.alert('Requerido', 'Selecciona una comuna.'); return; }
    if (!direccion) { Alert.alert('Requerido', 'Ingresa o selecciona una dirección.'); return; }
    router.push('/(tabs)/nueva-propiedad/caracteristicas');
  };

  return (
    <View style={styles.container}>
      <StepIndicator steps={STEPS} currentStep={1} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Región</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={region ?? ''}
            onValueChange={(val) => {
              setField('region', val || null);
              setField('comuna', null);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Selecciona región..." value="" />
            {comunasData.map((r) => (
              <Picker.Item key={r.codigo} label={r.region} value={r.region} />
            ))}
          </Picker>
        </View>

        <Text style={styles.sectionTitle}>Comuna</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={comuna ?? ''}
            onValueChange={(val) => setField('comuna', val || null)}
            enabled={comunas.length > 0}
            style={styles.picker}
          >
            <Picker.Item label="Selecciona comuna..." value="" />
            {comunas.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        <Text style={styles.sectionTitle}>Dirección y ubicación exacta</Text>
        <MapPicker
          lat={lat}
          lng={lng}
          address={direccion}
          onLocationChange={(newLat, newLng, addr) => {
            setField('lat', newLat);
            setField('lng', newLng);
            setField('direccion', addr);
          }}
        />

        {direccion ? (
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>📍 Dirección seleccionada:</Text>
            <Text style={styles.addressText}>{direccion}</Text>
          </View>
        ) : null}
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
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: { height: 50 },
  addressBox: {
    backgroundColor: '#f0f3fa',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0033A0',
  },
  addressLabel: { fontSize: 12, color: '#0033A0', fontWeight: '600', marginBottom: 4 },
  addressText: { fontSize: 13, color: '#333' },
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
