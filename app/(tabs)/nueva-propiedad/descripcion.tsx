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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import StepIndicator from '@/components/StepIndicator';
import CurrencyInput from '@/components/CurrencyInput';
import { useNuevaPropiedadStore } from '@/store/nuevaPropiedad';

const STEPS = ['Tipo', 'Ubicación', 'Características', 'Fotos', 'Descripción', 'Preview'];
const MAX_TITULO = 60;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function Paso5Descripcion() {
  const router = useRouter();
  const store = useNuevaPropiedadStore();

  const wordCount = countWords(store.descripcion);

  const handleContinuar = () => {
    if (!store.titulo.trim()) { Alert.alert('Requerido', 'Ingresa un título para el aviso.'); return; }
    if (!store.precio) { Alert.alert('Requerido', 'Ingresa el precio.'); return; }
    if (!store.telefonoCorredor.trim()) { Alert.alert('Requerido', 'Ingresa tu teléfono de contacto.'); return; }
    router.push('/(tabs)/nueva-propiedad/preview');
  };

  const formatPhone = (text: string): string => {
    const nums = text.replace(/[^\d+]/g, '');
    if (nums.startsWith('+56')) return nums;
    if (nums.startsWith('56')) return '+' + nums;
    if (nums.startsWith('9')) return '+56 ' + nums;
    return nums;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StepIndicator steps={STEPS} currentStep={4} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Título */}
        <Text style={styles.sectionTitle}>Título del aviso *</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.titleInput}
            value={store.titulo}
            onChangeText={(t) => store.setField('titulo', t.slice(0, MAX_TITULO))}
            placeholder="Ej: Hermoso departamento 3D/2B en Providencia con vista"
            placeholderTextColor="#bbb"
            maxLength={MAX_TITULO}
            multiline
          />
          <Text style={[styles.counter, store.titulo.length >= MAX_TITULO && styles.counterMax]}>
            {store.titulo.length}/{MAX_TITULO}
          </Text>
        </View>

        {/* Precio */}
        <Text style={styles.sectionTitle}>Precio *</Text>
        <CurrencyInput
          value={store.precio}
          moneda={store.moneda}
          onChangeValue={(v) => store.setField('precio', v)}
          onChangeMoneda={(m) => store.setField('moneda', m)}
        />

        {/* Gastos comunes (arriendo) */}
        {store.tipoOperacion === 'arriendo' && (
          <>
            <Text style={styles.sectionTitle}>Gastos comunes (CLP/mes) — opcional</Text>
            <TextInput
              style={styles.input}
              value={store.gastosComunes?.toString() ?? ''}
              onChangeText={(t) => store.setField('gastosComunes', t ? parseInt(t, 10) : null)}
              keyboardType="number-pad"
              placeholder="Ej: 80.000"
              placeholderTextColor="#bbb"
            />
          </>
        )}

        {/* Descripción */}
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.hint}>
          💡 Menciona: barrio, transporte cercano, colegios, orientación, condición del inmueble.
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.descInput}
            value={store.descripcion}
            onChangeText={(t) => store.setField('descripcion', t)}
            placeholder="Describe la propiedad con detalle..."
            placeholderTextColor="#bbb"
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.counter, wordCount >= 30 && styles.counterOk]}>
            {wordCount} palabras {wordCount >= 30 ? '✓ (recomendado)' : '(mín. 30 recomendado)'}
          </Text>
        </View>

        {/* Contacto corredor */}
        <Text style={styles.sectionTitle}>Datos de contacto *</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={store.nombreCorredor}
            onChangeText={(t) => store.setField('nombreCorredor', t)}
            placeholder="Tu nombre completo"
            placeholderTextColor="#bbb"
          />

          <Text style={styles.fieldLabel}>Teléfono *</Text>
          <TextInput
            style={styles.input}
            value={store.telefonoCorredor}
            onChangeText={(t) => store.setField('telefonoCorredor', formatPhone(t))}
            placeholder="+56 9 XXXX XXXX"
            placeholderTextColor="#bbb"
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={store.emailCorredor}
            onChangeText={(t) => store.setField('emailCorredor', t)}
            placeholder="correo@ejemplo.cl"
            placeholderTextColor="#bbb"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>WhatsApp disponible</Text>
            <Switch
              value={store.whatsappActivo}
              onValueChange={(v) => {
                store.setField('whatsappActivo', v);
                if (v && !store.whatsappNumero) {
                  store.setField('whatsappNumero', store.telefonoCorredor);
                }
              }}
              trackColor={{ true: '#0033A0' }}
            />
          </View>

          {store.whatsappActivo && (
            <>
              <Text style={styles.fieldLabel}>Número WhatsApp</Text>
              <TextInput
                style={styles.input}
                value={store.whatsappNumero}
                onChangeText={(t) => store.setField('whatsappNumero', formatPhone(t))}
                placeholder="+56 9 XXXX XXXX"
                placeholderTextColor="#bbb"
                keyboardType="phone-pad"
              />
            </>
          )}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinuar} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Vista previa →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  hint: { fontSize: 12, color: '#666', marginBottom: 8, fontStyle: 'italic' },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 4,
  },
  titleInput: { fontSize: 15, color: '#333', minHeight: 50 },
  descInput: { fontSize: 14, color: '#333', minHeight: 120 },
  counter: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 6 },
  counterMax: { color: '#ef4444' },
  counterOk: { color: '#22c55e' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 8 },
  fieldLabel: { fontSize: 13, color: '#666', fontWeight: '500', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
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
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
