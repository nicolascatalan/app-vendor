import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { FotoItem } from '@/store/nuevaPropiedad';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 32 - 8) / 3;

interface PhotoGridProps {
  photos: FotoItem[];
  onReorder: (photos: FotoItem[]) => void;
  onDelete: (uri: string) => void;
  onAdd: () => void;
}

export default function PhotoGrid({ photos, onReorder, onDelete, onAdd }: PhotoGridProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const movePhoto = (fromIndex: number, toIndex: number) => {
    const updated = [...photos];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onReorder(updated);
  };

  const renderItem = ({ item, index }: { item: FotoItem; index: number }) => (
    <TouchableOpacity
      style={styles.photoCell}
      onPress={() => setPreviewUri(item.uri)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.uri }} style={styles.photo} resizeMode="cover" />
      {index === 0 && (
        <View style={styles.portadaBadge}>
          <Text style={styles.portadaText}>Portada</Text>
        </View>
      )}
      {item.uploading && (
        <View style={styles.uploadingOverlay}>
          <Text style={styles.uploadingText}>{item.uploadProgress ?? 0}%</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(6, item.uploadProgress ?? 0)}%` },
              ]}
            />
          </View>
        </View>
      )}
      {item.uploadError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>⚠️</Text>
        </View>
      )}
      {item.mlId && !item.uploading && (
        <View style={styles.uploadedBadge}>
          <Text style={styles.uploadedText}>✓</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.uri)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
      {index > 0 && (
        <TouchableOpacity
          style={styles.moveLeftBtn}
          onPress={() => movePhoto(index, index - 1)}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.moveText}>◀</Text>
        </TouchableOpacity>
      )}
      {index < photos.length - 1 && (
        <TouchableOpacity
          style={styles.moveRightBtn}
          onPress={() => movePhoto(index, index + 1)}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.moveText}>▶</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const addCell = (
    <TouchableOpacity style={styles.addCell} onPress={onAdd} activeOpacity={0.7}>
      <Text style={styles.addIcon}>+</Text>
      <Text style={styles.addText}>Agregar</Text>
    </TouchableOpacity>
  );

  const data: Array<FotoItem | 'ADD'> = [...photos, 'ADD'];

  return (
    <View>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => (item === 'ADD' ? 'add' : (item as FotoItem).uri + idx)}
        numColumns={3}
        scrollEnabled={false}
        renderItem={({ item, index }) =>
          item === 'ADD' ? (
            <View key="add" style={styles.photoCell}>{addCell}</View>
          ) : (
            renderItem({ item: item as FotoItem, index })
          )
        }
        columnWrapperStyle={styles.row}
      />

      <Modal visible={!!previewUri} transparent animationType="fade">
        <TouchableOpacity
          style={styles.previewModal}
          activeOpacity={1}
          onPress={() => setPreviewUri(null)}
        >
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewUri(null)}>
            <Text style={styles.previewCloseText}>✕ Cerrar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  photoCell: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  portadaBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#0033A0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  portadaText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 11,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: { fontSize: 18, color: '#fff', fontWeight: '700', marginBottom: 8 },
  progressTrack: {
    width: '70%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#60a5fa',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,50,50,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { fontSize: 24 },
  uploadedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#22c55e',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  moveLeftBtn: {
    position: 'absolute',
    bottom: 4,
    left: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  moveRightBtn: {
    position: 'absolute',
    bottom: 4,
    right: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  moveText: { color: '#fff', fontSize: 10 },
  addCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0033A0',
    borderStyle: 'dashed',
    borderRadius: 8,
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  addIcon: { fontSize: 28, color: '#0033A0' },
  addText: { fontSize: 11, color: '#0033A0', marginTop: 2 },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '80%' },
  previewClose: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  previewCloseText: { color: '#fff', fontSize: 16 },
});
