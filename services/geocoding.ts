import Constants from 'expo-constants';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? '';
const GOOGLE_MAPS_BASE = 'https://maps.googleapis.com/maps/api';
// Nominatim (OpenStreetMap) — fallback gratuito, sin API key
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const NOMINATIM_HEADERS = { 'User-Agent': 'PropPublish/1.0 (cl.propublish.app)' };

const isGoogleKeyValid = (): boolean => {
  const key = GOOGLE_MAPS_API_KEY.trim();
  return !!key && key !== 'demo_maps_api_key';
};

export function getGeocodingConfigurationIssue(): string | null {
  return null; // Ahora tenemos fallback Nominatim, siempre funciona
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
}

export interface PlaceDetailsResult extends GeocodingResult {
  placeId: string;
}

// ─── Nominatim helpers ────────────────────────────────────────────────────────

async function nominatimGeocode(address: string): Promise<GeocodingResult | null> {
  try {
    const q = encodeURIComponent(`${address}, Chile`);
    const url = `${NOMINATIM_BASE}/search?q=${q}&format=json&addressdetails=1&limit=1&countrycodes=cl&accept-language=es`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    const item = data[0];
    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      formattedAddress: item.display_name,
    };
  } catch {
    return null;
  }
}

async function nominatimReverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

async function nominatimSearch(query: string): Promise<PlaceSuggestion[]> {
  try {
    const q = encodeURIComponent(`${query}, Chile`);
    const url = `${NOMINATIM_BASE}/search?q=${q}&format=json&addressdetails=1&limit=5&countrycodes=cl&accept-language=es`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => {
      const parts = (item.display_name as string).split(', ');
      return {
        placeId: `nominatim-${item.place_id}`,
        description: item.display_name,
        mainText: parts[0] ?? item.display_name,
        secondaryText: parts.slice(1, 3).join(', ') || undefined,
      };
    });
  } catch {
    return [];
  }
}

// ─── Exported functions ───────────────────────────────────────────────────────

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (isGoogleKeyValid()) {
    try {
      const query = encodeURIComponent(`${address}, Chile`);
      const url = `${GOOGLE_MAPS_BASE}/geocode/json?address=${query}&key=${GOOGLE_MAPS_API_KEY}&region=cl&language=es`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.length) {
          const result = data.results[0];
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address,
          };
        }
      }
    } catch { /* cae al fallback */ }
  }
  // Fallback: Nominatim
  return nominatimGeocode(address);
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (isGoogleKeyValid()) {
    try {
      const url = `${GOOGLE_MAPS_BASE}/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=es`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.length) {
          return data.results[0].formatted_address as string;
        }
      }
    } catch { /* cae al fallback */ }
  }
  // Fallback: Nominatim
  return nominatimReverseGeocode(lat, lng);
}

export async function searchPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 3) return [];

  if (isGoogleKeyValid()) {
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = `${GOOGLE_MAPS_BASE}/place/autocomplete/json?input=${encoded}&components=country:cl&language=es&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
          return (data.predictions ?? []).map((prediction: any) => ({
            placeId: prediction.place_id as string,
            description: prediction.description as string,
            mainText: prediction.structured_formatting?.main_text ?? prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text,
          }));
        }
      }
    } catch { /* cae al fallback */ }
  }
  // Fallback: Nominatim
  return nominatimSearch(query);
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
  if (!placeId) return null;

  // Si es un placeId de Nominatim, resolver con geocodificación directa
  if (placeId.startsWith('nominatim-')) {
    return null; // se resuelve vía handleSelectSuggestion con geocodeAddress
  }

  if (!isGoogleKeyValid()) return null;

  const url = `${GOOGLE_MAPS_BASE}/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=place_id,formatted_address,geometry&language=es&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (data.status !== 'OK' || !data.result) {
    console.warn('[geocoding] place details status:', data.status, data.error_message ?? '');
    return null;
  }

  return {
    placeId: data.result.place_id,
    formattedAddress: data.result.formatted_address,
    lat: data.result.geometry.location.lat,
    lng: data.result.geometry.location.lng,
  };
}
