import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[Login] isAuthenticated:', isAuthenticated, 'loading:', loading);
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (e) {
      Alert.alert('Error', 'No se pudo iniciar sesión. Intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0033A0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0033A0" />
      <View style={styles.header}>
        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.appName}>PropPublish</Text>
        <Text style={styles.tagline}>Publica propiedades en segundos</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Para corredores inmobiliarios</Text>
          <Text style={styles.cardDesc}>
            Ingresa todos los datos de tu propiedad y publícala directamente en Portal Inmobiliario.
          </Text>

          <View style={styles.features}>
            {['📋 Formulario guiado paso a paso', '📷 Sube fotos desde cámara o galería', '🗺️ Ubicación exacta en el mapa', '⚡ Publicación directa en el portal'].map((f) => (
              <Text key={f} style={styles.featureItem}>{f}</Text>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.loginButtonText}>Iniciar sesión con Portal Inmobiliario</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Al iniciar sesión aceptas los términos de uso de Portal Inmobiliario / MercadoLibre.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0033A0' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  logo: { fontSize: 64 },
  appName: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 8 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: {
    flex: 0.6,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    justifyContent: 'space-between',
  },
  card: { gap: 12 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  cardDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
  features: { gap: 8, marginTop: 8 },
  featureItem: { fontSize: 14, color: '#444' },
  loginButton: {
    backgroundColor: '#0033A0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0033A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#bbb', textAlign: 'center' },
});
