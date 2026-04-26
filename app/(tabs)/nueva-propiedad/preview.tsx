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
  Share,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Clipboard from 'expo-clipboard';
import { useNuevaPropiedadStore } from '@/store/nuevaPropiedad';
import { useAuth } from '@/hooks/useAuth';
import { publishProperty } from '@/services/portalInmobiliario';

const { width } = Dimensions.get('window');

type ListingTypeId = 'free' | 'silver' | 'gold' | 'gold_special' | 'gold_pro';

const LISTING_PLANS: {
  id: ListingTypeId;
  label: string;
  badge: string;
  badgeColor: string;
  desc: string;
  onlyVenta?: boolean;
}[] = [
  {
    id: 'free',
    label: 'Gratuita',
    badge: '🆓 Gratis',
    badgeColor: '#27ae60',
    desc: 'Sin costo. Visibilidad básica. Solo disponible en venta.',
    onlyVenta: true,
  },
  {
    id: 'silver',
    label: 'Publicación Plata',
    badge: '🥈 Plata',
    badgeColor: '#7f8c8d',
    desc: 'Mayor visibilidad. Tarifa mensual según categoría.',
  },
  {
    id: 'gold',
    label: 'Publicación Oro',
    badge: '🥇 Oro',
    badgeColor: '#f39c12',
    desc: 'Alta visibilidad en los resultados de búsqueda.',
  },
  {
    id: 'gold_special',
    label: 'Publicación Oro Especial',
    badge: '⭐ Oro Especial',
    badgeColor: '#e67e22',
    desc: 'Máxima visibilidad y posicionamiento prioritario.',
  },
  {
    id: 'gold_pro',
    label: 'Publicación Oro Premium',
    badge: '💎 Premium',
    badgeColor: '#8e44ad',
    desc: 'El plan más destacado. Máxima exposición garantizada.',
  },
];

export default function Paso6Preview() {
  const router = useRouter();
  const store = useNuevaPropiedadStore();
  const { getAccessToken, refreshAccessToken } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [successData, setSuccessData] = useState<{ itemId: string; permalink: string } | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const checkAnim = useRef(new Animated.Value(0)).current;

  const handleShare = async (platform?: 'whatsapp' | 'instagram' | 'general') => {
    const precio = store.moneda === 'UF'
      ? `UF ${store.precio?.toLocaleString('es-CL')}`
      : `$${store.precio?.toLocaleString('es-CL')}`;

    const lineas = [
      `🏠 ${store.tipoPropiedad ?? 'Propiedad'} en ${store.tipoOperacion ?? ''} — ${store.titulo}`,
      `💰 Precio: ${precio}`,
      store.dormitorios > 0 ? `🛏 Dormitorios: ${store.dormitorios}` : null,
      store.banos > 0       ? `🚿 Baños: ${store.banos}`            : null,
      store.superficieTotal ? `📐 Superficie: ${store.superficieTotal} m²` : null,
      (store.comuna || store.region)
        ? `📍 ${[store.comuna, store.region].filter(Boolean).join(', ')}`
        : null,
      store.direccion ? `🗺 ${store.direccion}` : null,
      '',
      store.descripcion?.trim() || null,
      '',
      '📲 Consultas al corredor de la propiedad.',
      successData?.permalink ? `\n🔗 Ver aviso: ${successData.permalink}` : null,
    ].filter((l) => l !== null).join('\n');

    // La foto del picker ya es file:// local (procesada por useImagePicker con ImageManipulator)
    // No recomprimir — usarla directamente para máxima calidad
    const coverUri: string | null = store.fotos[0]?.uri ?? null;

    if (platform === 'whatsapp') {
      const url = `whatsapp://send?text=${encodeURIComponent(lineas)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) { await Linking.openURL(url); }
      else { Alert.alert('WhatsApp no instalado', 'Instala WhatsApp para usar esta función.'); }
      return;
    }

    // Instagram: SOLO url (sin message) → iOS detecta imagen → muestra Instagram/Facebook
    if (platform === 'instagram') {
      if (!coverUri) {
        await Share.share({ message: lineas }, { dialogTitle: 'Compartir' });
        return;
      }
      // Copiar texto al portapapeles antes de abrir share sheet
      await Clipboard.setStringAsync(lineas);
      Alert.alert(
        '📋 Texto copiado al portapapeles',
        'Al publicar en Instagram, mantén presionado el campo de descripción y toca "Pegar" para agregar el texto.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir share →',
            onPress: () =>
              Share.share(
                { url: coverUri! },
                { dialogTitle: 'Selecciona Instagram' }
              ),
          },
        ]
      );
      return;
    }

    // Share general: imagen + texto (Mensajes, Mail reciben ambos)
    await Share.share(
      {
        message: lineas,
        title: store.titulo,
        ...(coverUri ? { url: coverUri } : {}),
      },
      { dialogTitle: 'Compartir propiedad' }
    );
  };

  const formatPrecio = () => {
    if (!store.precio) return 'Sin precio';
    if (store.moneda === 'UF') return `UF ${store.precio.toLocaleString('es-CL')}`;
    return `$${store.precio.toLocaleString('es-CL')}`;
  };

  const handlePublicar = async () => {
    const missingFields = [
      !store.titulo.trim() ? 'título' : null,
      !store.precio ? 'precio' : null,
      !store.direccion ? 'dirección' : null,
      !store.lat || !store.lng ? 'ubicación en mapa' : null,
      store.fotos.filter((foto) => foto.mlId).length < 3 ? 'mínimo 3 fotos subidas' : null,
      !store.telefonoCorredor.trim() ? 'teléfono de contacto' : null,
      (!store.superficieTotal || store.superficieTotal <= 0) ? 'superficie total (m²)' : null,
      (!store.superficieUtil || store.superficieUtil <= 0) ? 'superficie útil (m²)' : null,
    ].filter(Boolean) as string[];

    if (missingFields.length > 0) {
      Alert.alert('Faltan datos para publicar', `Completa: ${missingFields.join(', ')}.`);
      return;
    }

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
      // Detectar errores de ML relacionados con superficie (TOTAL_AREA / COVERED_AREA)
      const errorText = result.error ?? 'Error desconocido';
      const isAreaError =
        errorText.includes('TOTAL_AREA') ||
        errorText.includes('COVERED_AREA') ||
        errorText.includes('was dropped');

      if (isAreaError) {
        Alert.alert(
          '📐 Falta la superficie',
          'La categoría seleccionada requiere ingresar la Superficie Total y Superficie Útil.\n\nVuelve al paso Características y completa los m².',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: '← Ir a Características',
              onPress: () => router.push('/(tabs)/nueva-propiedad/caracteristicas'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error al publicar',
          errorText,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Reintentar', onPress: handlePublicar },
          ]
        );
      }
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
              <Text style={styles.descText} numberOfLines={showFullDescription ? undefined : 3}>
                {store.descripcion}
              </Text>
              {store.descripcion.length > 140 ? (
                <TouchableOpacity onPress={() => setShowFullDescription((current) => !current)}>
                  <Text style={styles.expandText}>{showFullDescription ? 'Ver menos' : 'Ver más'}</Text>
                </TouchableOpacity>
              ) : null}
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

          {/* Selector de plan de publicación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📢 Plan de publicación</Text>
            <Text style={styles.planSubtitle}>Elige cómo quieres destacar tu aviso en MercadoLibre</Text>
            {LISTING_PLANS.filter((p) => !p.onlyVenta || store.tipoOperacion === 'venta').map((plan) => {
              const selected = (store.listingType ?? (store.tipoOperacion === 'venta' ? 'free' : 'silver')) === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                  onPress={() => store.setField('listingType', plan.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.planRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>{plan.label}</Text>
                      <Text style={styles.planDesc}>{plan.desc}</Text>
                    </View>
                    <View style={[styles.planBadge, { backgroundColor: plan.badgeColor }]}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                    {selected && <Text style={styles.planCheck}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

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

      <Modal visible={publishing} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0033A0" />
            <Text style={styles.loadingTitle}>Publicando en Portal Inmobiliario...</Text>
            <Text style={styles.loadingText}>Estamos enviando fotos, ubicación y datos del corredor.</Text>
          </View>
        </View>
      </Modal>

      {/* Modal de éxito */}
      <Modal visible={!!successData} transparent animationType="fade">
        <View style={styles.successModal}>
          <Animated.View style={[styles.successCard, { transform: [{ scale: checkAnim }] }]}>
            <Text style={styles.checkIcon}>✅</Text>
            <Text style={styles.successTitle}>¡Propiedad publicada!</Text>
            <Text style={styles.successDesc}>Tu aviso está activo en Portal Inmobiliario.</Text>

            {/* Ver aviso */}
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => successData && Linking.openURL(successData.permalink)}
            >
              <Text style={styles.successBtnText}>🔗 Ver mi publicación</Text>
            </TouchableOpacity>

            {/* Compartir — separador */}
            <Text style={styles.shareLabel}>Compartir aviso</Text>
            <View style={styles.shareRow}>
              {/* WhatsApp */}
              <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare('whatsapp')}>
                <Text style={styles.shareBtnIcon}>💬</Text>
                <Text style={styles.shareBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              {/* Instagram */}
              <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare('instagram')}>
                <Text style={styles.shareBtnIcon}>📸</Text>
                <Text style={styles.shareBtnText}>Instagram</Text>
              </TouchableOpacity>

              {/* Más opciones (Facebook, Mail, SMS…) */}
              <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare('general')}>
                <Text style={styles.shareBtnIcon}>📤</Text>
                <Text style={styles.shareBtnText}>Más</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.successBtnSecondary, { marginTop: 8 }]}
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
  expandText: { fontSize: 13, color: '#0033A0', fontWeight: '700', marginTop: 8 },
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: '#0033A0', marginTop: 14 },
  loadingText: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
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
  shareLabel: { fontSize: 13, color: '#888', fontWeight: '600', marginTop: 16, marginBottom: 10, alignSelf: 'flex-start' },
  shareRow: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'space-between' },
  shareBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e3ef',
  },
  shareBtnIcon: { fontSize: 26, marginBottom: 4 },
  shareBtnText: { fontSize: 11, color: '#444', fontWeight: '600' },
  planSubtitle: { fontSize: 13, color: '#888', marginBottom: 12 },
  planCard: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  planCardSelected: {
    borderColor: '#0033A0',
    backgroundColor: '#f0f4ff',
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 2 },
  planLabelSelected: { color: '#0033A0' },
  planDesc: { fontSize: 12, color: '#777', lineHeight: 17 },
  planBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  planBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planCheck: { fontSize: 18, color: '#0033A0', fontWeight: '800', marginLeft: 4 },
});
