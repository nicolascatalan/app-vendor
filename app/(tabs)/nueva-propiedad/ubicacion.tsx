import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import StepIndicator from '@/components/StepIndicator';
import MapPicker from '@/components/MapPicker';
import { useNuevaPropiedadStore } from '@/store/nuevaPropiedad';
import comunasData from '@/data/comunas-chile.json';

const STEPS = ['Tipo', 'Ubicación', 'Características', 'Fotos', 'Descripción', 'Preview'];

type PickerModalProps = {
  visible: boolean;
  title: string;
  items: string[];
  selected: string | null;
  onSelect: (val: string) => void;
  onClose: () => void;
};

function PickerModal({ visible, title, items, selected, onSelect, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <SafeAreaView style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Text style={modalStyles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[modalStyles.item, selected === item && modalStyles.itemSelected]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={[modalStyles.itemText, selected === item && modalStyles.itemTextSelected]}>
                  {item}
                </Text>
                {selected === item && <Text style={modalStyles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export default function Paso2Ubicacion() {
  const router = useRouter();
  const { region, comuna, direccion, lat, lng, setField } = useNuevaPropiedadStore();
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showComunaPicker, setShowComunaPicker] = useState(false);

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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionTitle}>Región</Text>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setShowRegionPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectBtnText, !region && styles.placeholder]}>
            {region ?? 'Selecciona una región...'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Comuna</Text>
        <TouchableOpacity
          style={[styles.selectBtn, !region && styles.selectBtnDisabled]}
          onPress={() => { if (region) setShowComunaPicker(true); }}
          activeOpacity={region ? 0.8 : 1}
        >
          <Text style={[styles.selectBtnText, !comuna && styles.placeholder]}>
            {comuna ?? (region ? 'Selecciona una comuna...' : 'Primero selecciona una región')}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

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

      <PickerModal
        visible={showRegionPicker}
        title="Selecciona una región"
        items={comunasData.map((r) => r.region)}
        selected={region}
        onSelect={(val) => {
          setField('region', val);
          setField('comuna', null);
        }}
        onClose={() => setShowRegionPicker(false)}
      />

      <PickerModal
        visible={showComunaPicker}
        title="Selecciona una comuna"
        items={comunas}
        selected={comuna}
        onSelect={(val) => setField('comuna', val)}
        onClose={() => setShowComunaPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  selectBtnDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  selectBtnText: { flex: 1, fontSize: 15, color: '#111' },
  placeholder: { color: '#aaa' },
  chevron: { fontSize: 20, color: '#aaa', marginLeft: 8 },
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#111' },
  closeBtn: { paddingHorizontal: 4 },
  closeText: { fontSize: 15, color: '#0033A0', fontWeight: '600' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  itemSelected: { backgroundColor: '#f0f3fa' },
  itemText: { flex: 1, fontSize: 15, color: '#111' },
  itemTextSelected: { color: '#0033A0', fontWeight: '600' },
  checkmark: { fontSize: 16, color: '#0033A0' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 20 },
});
