import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Linking,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useNuevaPropiedadStore } from '@/store/nuevaPropiedad';
import { useAuth } from '@/hooks/useAuth';
import { publishProperty } from '@/services/portalInmobiliario';

const { width } = Dimensions.get('window');

export default function Paso6Preview() {
  const router = useRouter();
  const store = useNuevaPropiedadStore();
  const { getAccessToken, refreshAccessToken } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [successData, setSuccessData] = useState<{ itemId: string; permalink: string } | null>(null);
  const checkAnim = useRef(new Animated.Value(0)).current;

  const formatPrecio = () => {
    if (!store.precio) return 'Sin precio';
    if (store.moneda === 'UF') return `UF ${store.precio.toLocaleString('es-CL')}`;
    return `$${store.precio.toLocaleString('es-CL')}`;
  };

  const handlePublicar = async () => {
    setPublishing(true);
    let token = await getAccessToken();
    if (!token) {
      setPublishing(false);
      Alert.alert('Error', 'Sesión expirada. Vuelve a iniciar sesión.');
      return;
    }

    let result = await publishProperty(store, token);

    if (!result.success && result.error?.includes('expirada')) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        result = await publishProperty(store, newToken);
      }
    }

    setPublishing(false);

    if (result.success && result.itemId && result.permalink) {
      setSuccessData({ itemId: result.itemId, permalink: result.permalink });
      store.resetForm();
      Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, tension: 50 }).start();
    } else {
      Alert.alert(
        'Error al publicar',
        result.error ?? 'Error desconocido',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reintentar', onPress: handlePublicar },
        ]
      );
    }
  };

  const chips = [
    store.dormitorios > 0 && `🛏 ${store.dormitorios} dorm.`,
    store.banos > 0 && `🚿 ${store.banos} baños`,
    store.superficieTotal && `📐 ${store.superficieTotal}m²`,
    store.estacionamientos > 0 && `🚗 ${store.estacionamientos} estac.`,
    store.bodegas > 0 && `📦 ${store.bodegas} bod.`,
  ].filter(Boolean) as string[];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Carrusel de fotos */}
        {store.fotos.length > 0 && (
          <FlatList
            data={store.fotos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(f) => f.uri}
            renderItem={({ item }) => (
              <Image source={{ uri: item.uri }} style={styles.photoSlide} resizeMode="cover" />
            )}
          />
        )}

        <View style={styles.content}>
          {/* Operación badge */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {store.tipoOperacion === 'venta' ? '🏷️ Venta' : '🔑 Arriendo'}
              </Text>
            </View>
            {store.tipoPropiedad && (
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeTextSecondary}>{store.tipoPropiedad}</Text>
              </View>
            )}
          </View>

          {/* Precio */}
          <Text style={styles.price}>{formatPrecio()}</Text>
          {store.gastosComunes ? (
            <Text style={styles.gastosText}>+ GC ${store.gastosComunes.toLocaleString('es-CL')}/mes</Text>
          ) : null}

          {/* Título */}
          <Text style={styles.title}>{store.titulo || '(Sin título)'}</Text>

          {/* Chips */}
          {chips.length > 0 && (
            <View style={styles.chipsRow}>
              {chips.map((c) => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ubicación */}
          {store.direccion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Ubicación</Text>
              <Text style={styles.addressText}>{store.direccion}</Text>
              {store.lat && store.lng && (
                <MapView
                  style={styles.miniMap}
                  initialRegion={{ latitude: store.lat, longitude: store.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker coordinate={{ latitude: store.lat, longitude: store.lng }} />
                </MapView>
              )}
            </View>
          )}

          {/* Descripción */}
          {store.descripcion ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Descripción</Text>
              <Text style={styles.descText}>{store.descripcion}</Text>
            </View>
          ) : null}

          {/* Contacto */}
          {store.nombreCorredor || store.telefonoCorredor ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Contacto</Text>
              {store.nombreCorredor ? <Text style={styles.contactText}>{store.nombreCorredor}</Text> : null}
              {store.telefonoCorredor ? <Text style={styles.contactText}>📞 {store.telefonoCorredor}</Text> : null}
              {store.whatsappActivo ? <Text style={styles.contactText}>💬 WhatsApp: {store.whatsappNumero}</Text> : null}
              {store.emailCorredor ? <Text style={styles.contactText}>✉️ {store.emailCorredor}</Text> : null}
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Botón publicar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
          onPress={handlePublicar}
          disabled={publishing}
          activeOpacity={0.85}
        >
          {publishing ? (
            <View style={styles.publishingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.publishBtnText}>  Publicando...</Text>
            </View>
          ) : (
            <Text style={styles.publishBtnText}>🚀 Publicar en Portal Inmobiliario</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de éxito */}
      <Modal visible={!!successData} transparent animationType="fade">
        <View style={styles.successModal}>
          <Animated.View style={[styles.successCard, { transform: [{ scale: checkAnim }] }]}>
            <Text style={styles.checkIcon}>✅</Text>
            <Text style={styles.successTitle}>¡Propiedad publicada!</Text>
            <Text style={styles.successDesc}>Tu aviso está activo en Portal Inmobiliario.</Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => successData && Linking.openURL(successData.permalink)}
            >
              <Text style={styles.successBtnText}>Ver mi publicación</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successBtnSecondary}
              onPress={() => {
                setSuccessData(null);
                router.replace('/(tabs)/nueva-propiedad');
              }}
            >
              <Text style={styles.successBtnSecondaryText}>Publicar otra propiedad</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSuccessData(null);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.successLink}>Ver mis publicaciones</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  photoSlide: { width, height: 260 },
  content: { padding: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { backgroundColor: '#0033A0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  badgeSecondary: { backgroundColor: '#f0f3fa' },
  badgeTextSecondary: { color: '#0033A0', fontSize: 13, fontWeight: '600' },
  price: { fontSize: 28, fontWeight: '800', color: '#0033A0', marginBottom: 2 },
  gastosText: { fontSize: 12, color: '#666', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#ddd' },
  chipText: { fontSize: 13, color: '#555' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 8 },
  addressText: { fontSize: 13, color: '#555', marginBottom: 8 },
  miniMap: { height: 150, borderRadius: 12, overflow: 'hidden' },
  descText: { fontSize: 14, color: '#555', lineHeight: 22 },
  contactText: { fontSize: 14, color: '#444', marginBottom: 4 },
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
  publishBtn: { backgroundColor: '#0033A0', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  publishBtnDisabled: { backgroundColor: '#aab4d4' },
  publishBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  publishingRow: { flexDirection: 'row', alignItems: 'center' },
  successModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', gap: 12, width: '100%' },
  checkIcon: { fontSize: 64 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#333' },
  successDesc: { fontSize: 14, color: '#666', textAlign: 'center' },
  successBtn: { backgroundColor: '#0033A0', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, width: '100%', alignItems: 'center' },
  successBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successBtnSecondary: { backgroundColor: '#f0f3fa', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, width: '100%', alignItems: 'center' },
  successBtnSecondaryText: { color: '#0033A0', fontWeight: '700', fontSize: 14 },
  successLink: { color: '#0033A0', fontSize: 13, textDecorationLine: 'underline', marginTop: 4 },
});
