import Constants from 'expo-constants';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? '';

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const query = encodeURIComponent(`${address}, Chile`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_MAPS_API_KEY}&region=cl&language=es`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.length) return null;

  const result = data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=es`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.length) return null;

  return data.results[0].formatted_address as string;
}
