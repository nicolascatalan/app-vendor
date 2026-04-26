import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import {
  geocodeAddress,
  getPlaceDetails,
  PlaceSuggestion,
  reverseGeocode,
  searchPlaceSuggestions,
} from '@/services/geocoding';

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
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const skipAutocompleteRef = useRef(false);

  const applyLocation = (newLat: number, newLng: number, newAddress: string) => {
    onLocationChange(newLat, newLng, newAddress);
    mapRef.current?.animateToRegion({
      latitude: newLat,
      longitude: newLng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  useEffect(() => {
    setSearchText(address ?? '');
  }, [address]);

  useEffect(() => {
    const query = searchText.trim();

    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }

    if (query.length < 4) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      setLoadingSuggestions(true);
      const results = await searchPlaceSuggestions(query);

      if (!active) {
        return;
      }

      setSuggestions(results);
      setLoadingSuggestions(false);
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [searchText]);

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setSearching(true);
    setError(null);
    setSuggestions([]);

    try {
      const result = await geocodeAddress(searchText.trim());
      if (result) {
        skipAutocompleteRef.current = true;
        setSearchText(result.formattedAddress);
        applyLocation(result.lat, result.lng, result.formattedAddress);
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
    if (addr) {
      skipAutocompleteRef.current = true;
      setSearchText(addr);
    }
    setSuggestions([]);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setSearching(true);
    setError(null);
    setSuggestions([]);

    try {
      // Si es sugerencia Nominatim, geocodificar por descripción directamente
      const result = suggestion.placeId.startsWith('nominatim-')
        ? await geocodeAddress(suggestion.description)
        : await getPlaceDetails(suggestion.placeId);

      if (!result) {
        setError('No pudimos obtener esa dirección. Intenta nuevamente.');
        return;
      }

      skipAutocompleteRef.current = true;
      setSearchText(result.formattedAddress);
      applyLocation(result.lat, result.lng, result.formattedAddress);
    } catch {
      setError('Error al cargar la dirección seleccionada.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={(value) => {
              setError(null);
              setSearchText(value);
            }}
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
        {(loadingSuggestions || suggestions.length > 0) && (
          <View style={styles.suggestionsBox}>
            {loadingSuggestions ? (
              <View style={styles.suggestionLoadingRow}>
                <ActivityIndicator size="small" color="#0033A0" />
                <Text style={styles.suggestionLoadingText}>Buscando direcciones…</Text>
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                style={styles.suggestionsList}
              >
                {suggestions.slice(0, 5).map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.placeId}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.suggestionTitle}>{suggestion.mainText}</Text>
                    {suggestion.secondaryText ? (
                      <Text style={styles.suggestionSubtitle}>{suggestion.secondaryText}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
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
              if (addr) {
                skipAutocompleteRef.current = true;
                setSearchText(addr);
              }
              setSuggestions([]);
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
  searchWrapper: { zIndex: 20 },
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
  suggestionsBox: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 220,
  },
  suggestionLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  suggestionLoadingText: {
    fontSize: 13,
    color: '#0033A0',
    fontWeight: '600',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
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
