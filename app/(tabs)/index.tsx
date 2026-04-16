import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getUserItems, pauseItem, activateItem, deleteItem } from '@/services/portalInmobiliario';

interface PropertyItem {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  thumbnail: string;
  status: string;
  permalink: string;
}

export default function MisPublicaciones() {
  const router = useRouter();
  const { isAuthenticated, getAccessToken, user } = useAuth();
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      loadItems();
    }
  }, [isAuthenticated]);

  const loadItems = async () => {
    if (!user) return;
    setRefreshing(true);
    const token = await getAccessToken();
    if (!token) return;
    const data = await getUserItems(user.id, token);
    setItems(data.filter(Boolean));
    setRefreshing(false);
  };

  const handlePauseToggle = async (item: PropertyItem) => {
    const token = await getAccessToken();
    if (!token) return;
    if (item.status === 'active') {
      await pauseItem(item.id, token);
    } else {
      await activateItem(item.id, token);
    }
    loadItems();
  };

  const handleDelete = (item: PropertyItem) => {
    Alert.alert(
      'Eliminar publicación',
      `¿Deseas cerrar "${item.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar aviso',
          style: 'destructive',
          onPress: async () => {
            const token = await getAccessToken();
            if (!token) return;
            await deleteItem(item.id, token);
            loadItems();
          },
        },
      ]
    );
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'CLF') return `UF ${price.toLocaleString('es-CL')}`;
    return `$${price.toLocaleString('es-CL')}`;
  };

  const statusColor = (status: string) => {
    if (status === 'active') return '#22c55e';
    if (status === 'paused') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis publicaciones</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/(tabs)/nueva-propiedad')}
        >
          <Text style={styles.newBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadItems} />}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>Sin publicaciones aún</Text>
              <Text style={styles.emptyDesc}>Crea tu primera propiedad y publícala en segundos.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/nueva-propiedad')}
              >
                <Text style={styles.emptyBtnText}>Publicar propiedad</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail.replace('http://', 'https://') }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 32 }}>🏠</Text>
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardPrice}>{formatPrice(item.price, item.currency_id)}</Text>
              <View style={styles.cardBottom}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                <Text style={styles.statusText}>
                  {item.status === 'active' ? 'Activo' : item.status === 'paused' ? 'Pausado' : 'Cerrado'}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(item.permalink)}
              >
                <Text style={styles.actionBtnText}>Ver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() => handlePauseToggle(item)}
              >
                <Text style={styles.actionBtnTextSecondary}>
                  {item.status === 'active' ? 'Pausar' : 'Activar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0033A0' },
  newBtn: {
    backgroundColor: '#0033A0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#666', textAlign: 'center' },
  emptyBtn: { backgroundColor: '#0033A0', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  thumb: { width: 90, height: 90 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#333' },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#0033A0' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: '#666' },
  cardActions: { padding: 8, justifyContent: 'space-around', alignItems: 'center', gap: 4 },
  actionBtn: { backgroundColor: '#0033A0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  actionBtnSecondary: { backgroundColor: '#f0f3fa' },
  actionBtnTextSecondary: { color: '#0033A0', fontSize: 11, fontWeight: '600' },
  deleteText: { color: '#ef4444', fontSize: 16, padding: 4 },
});
