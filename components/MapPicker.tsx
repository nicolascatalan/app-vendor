import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { geocodeAddress, reverseGeocode } from '@/services/geocoding';

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  address: string | null;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

const CHILE_REGION = {
  latitude: -33.45,
  longitude: -70.65,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export default function MapPicker({ lat, lng, address, onLocationChange }: MapPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [searchText, setSearchText] = useState(address ?? '');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const result = await geocodeAddress(searchText.trim());
      if (result) {
        onLocationChange(result.lat, result.lng, result.formattedAddress);
        mapRef.current?.animateToRegion({
          latitude: result.lat,
          longitude: result.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        setError('Dirección no encontrada. Intenta con otra búsqueda.');
      }
    } catch {
      setError('Error al buscar dirección.');
    } finally {
      setSearching(false);
    }
  };

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const addr = await reverseGeocode(latitude, longitude);
    onLocationChange(latitude, longitude, addr ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    if (addr) setSearchText(addr);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar dirección en Chile..."
          placeholderTextColor="#bbb"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
          {searching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchBtnText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          lat && lng
            ? { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
            : CHILE_REGION
        }
        onPress={handleMapPress}
      >
        {lat && lng && (
          <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            draggable
            onDragEnd={async (e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              const addr = await reverseGeocode(latitude, longitude);
              onLocationChange(latitude, longitude, addr ?? '');
              if (addr) setSearchText(addr);
            }}
            pinColor="#0033A0"
          />
        )}
      </MapView>
      <Text style={styles.hint}>Toca el mapa o arrastra el pin para ajustar la ubicación exacta.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0033A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontSize: 18 },
  error: { color: '#e53e3e', fontSize: 12 },
  map: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});
