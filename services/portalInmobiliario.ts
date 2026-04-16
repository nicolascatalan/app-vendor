import { NuevaPropiedad } from '@/store/nuevaPropiedad';

const ML_API_BASE = 'https://api.mercadolibre.com';

// MercadoLibre category for Chilean real estate
const CATEGORY_ID = 'MLC1459';

function mapPropertyType(tipo: NuevaPropiedad['tipoPropiedad']): string {
  const map: Record<string, string> = {
    casa: 'Casa',
    departamento: 'Departamento',
    oficina: 'Oficina',
    local: 'Local comercial',
    terreno: 'Terreno',
    bodega: 'Bodega',
    estacionamiento: 'Estacionamiento',
    parcela: 'Parcela',
  };
  return tipo ? (map[tipo] ?? tipo) : '';
}

export interface PublishResult {
  success: boolean;
  itemId?: string;
  permalink?: string;
  error?: string;
}

export async function publishProperty(
  data: NuevaPropiedad,
  accessToken: string
): Promise<PublishResult> {
  const attributes: Array<{ id: string; value_name?: string | number; value_struct?: { number: number; unit: string } }> = [
    { id: 'OPERATION', value_name: data.tipoOperacion === 'venta' ? 'Venta' : 'Arriendo' },
    { id: 'PROPERTY_TYPE', value_name: mapPropertyType(data.tipoPropiedad) },
  ];

  if (data.superficieTotal) {
    attributes.push({ id: 'TOTAL_AREA', value_struct: { number: data.superficieTotal, unit: 'm²' } });
  }
  if (data.superficieUtil) {
    attributes.push({ id: 'COVERED_AREA', value_struct: { number: data.superficieUtil, unit: 'm²' } });
  }
  if (data.dormitorios >= 0) attributes.push({ id: 'BEDROOMS', value_name: data.dormitorios });
  if (data.banos >= 0) attributes.push({ id: 'FULL_BATHROOMS', value_name: data.banos });
  if (data.estacionamientos >= 0) attributes.push({ id: 'PARKING_LOTS', value_name: data.estacionamientos });
  if (data.piso) attributes.push({ id: 'FLOORS', value_name: data.piso });
  if (data.antiguedad) attributes.push({ id: 'PROPERTY_AGE', value_name: data.antiguedad });
  if (data.comuna) attributes.push({ id: 'COMUNE', value_name: data.comuna });
  if (data.orientacion) attributes.push({ id: 'ORIENTATION', value_name: data.orientacion });
  if (data.amoblado) attributes.push({ id: 'FURNISHED', value_name: 'Sí' });
  if (data.mascotas) attributes.push({ id: 'PETS_ALLOWED', value_name: 'Sí' });

  const body = {
    title: data.titulo,
    category_id: CATEGORY_ID,
    price: data.precio,
    currency_id: data.moneda === 'UF' ? 'CLF' : 'CLP',
    available_quantity: 1,
    buying_mode: 'classified',
    condition: 'not_specified',
    listing_type_id: 'gold_special',
    description: { plain_text: data.descripcion },
    pictures: data.fotos.filter((f) => f.mlId).map((f) => ({ id: f.mlId })),
    attributes,
    location: {
      address_line: data.direccion,
      geolocation: data.lat && data.lng ? { latitude: data.lat, longitude: data.lng } : undefined,
    },
    seller_contact: {
      contact: data.nombreCorredor,
      other_info: data.descripcion,
      phone: data.telefonoCorredor,
      phone2: data.whatsappActivo ? data.whatsappNumero : undefined,
    },
  };

  try {
    const res = await fetch(`${ML_API_BASE}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      return { success: false, error: 'Sesión expirada. Por favor vuelve a iniciar sesión.' };
    }

    const json = await res.json();

    if (!res.ok) {
      const msg = json?.message ?? json?.error ?? 'Error al publicar. Intenta nuevamente.';
      return { success: false, error: msg };
    }

    return { success: true, itemId: json.id, permalink: json.permalink };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error de conexión' };
  }
}

export async function uploadPhoto(uri: string, accessToken: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const res = await fetch(`${ML_API_BASE}/pictures/items/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (res.status === 401) throw new Error('TOKEN_EXPIRED');

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.message ?? 'Error al subir foto');
  }

  const json = await res.json();
  return json.id as string;
}

export async function getUserItems(
  userId: string,
  accessToken: string
): Promise<any[]> {
  const res = await fetch(
    `${ML_API_BASE}/users/${userId}/items/search?status=active&limit=50`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const ids: string[] = json.results ?? [];
  if (ids.length === 0) return [];

  const itemsRes = await fetch(`${ML_API_BASE}/items?ids=${ids.join(',')}&attributes=id,title,price,currency_id,thumbnail,status,permalink`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!itemsRes.ok) return [];
  const itemsJson = await itemsRes.json();
  return itemsJson.map((r: any) => r.body);
}

export async function pauseItem(itemId: string, accessToken: string): Promise<boolean> {
  const res = await fetch(`${ML_API_BASE}/items/${itemId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'paused' }),
  });
  return res.ok;
}

export async function activateItem(itemId: string, accessToken: string): Promise<boolean> {
  const res = await fetch(`${ML_API_BASE}/items/${itemId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'active' }),
  });
  return res.ok;
}

export async function deleteItem(itemId: string, accessToken: string): Promise<boolean> {
  const res = await fetch(`${ML_API_BASE}/items/${itemId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'closed' }),
  });
  return res.ok;
}
