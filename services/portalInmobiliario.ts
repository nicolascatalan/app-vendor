import { NuevaPropiedad } from '@/store/nuevaPropiedad';

const ML_API_BASE = 'https://api.mercadolibre.com';

// Categorías hoja (leaf) verificadas con API de ML Chile
// Usamos siempre "Propiedades usadas" (no proyectos nuevos)
const CATEGORY_MAP: Record<string, Record<string, string>> = {
  casa:             { venta: 'MLC157520', arriendo: 'MLC183184' },
  departamento:     { venta: 'MLC157522', arriendo: 'MLC183186' },
  loft:             { venta: 'MLC157522', arriendo: 'MLC183186' }, // ML CL no tiene categoría loft, comparte con departamento
  oficina:          { venta: 'MLC157413', arriendo: 'MLC183187' },
  local:            { venta: 'MLC50612',  arriendo: 'MLC50611'  },
  terreno:          { venta: 'MLC152993', arriendo: 'MLC152994' },
  bodega:           { venta: 'MLC50566',  arriendo: 'MLC50565'  },
  estacionamiento:  { venta: 'MLC50612',  arriendo: 'MLC50611'  },
  parcela:          { venta: 'MLC458189', arriendo: 'MLC6404'   },
};

// Listing types válidos para Real Estate en ML Chile
// Real Estate NO acepta 'free' — requiere plan pago mínimo 'bronze'
const REAL_ESTATE_LISTING_TYPE = 'gold_special';

// Mapa de inferencia: plan → listing_type_id (cuando el valor viene null desde API o config)
const PLAN_TO_LISTING_TYPE: Record<string, string> = {
  free:         'free',
  bronze:       'bronze',
  silver:       'silver',
  gold:         'gold',
  gold_special: 'gold_special',
  gold_pro:     'gold_pro',
};

// Reglas de inferencia plan + category → listing_type_id
// Basado en: https://developers.mercadolibre.com.ar/es_ar/publica-tu-anuncio
function inferListingType(plan?: string | null, categoryId?: string | null): string {
  // Si el plan es válido y conocido, usarlo directamente
  if (plan && PLAN_TO_LISTING_TYPE[plan]) {
    return PLAN_TO_LISTING_TYPE[plan];
  }
  // Real Estate (MLC prefix + categorías inmobiliarias) requiere mínimo gold_special
  if (categoryId?.startsWith('MLC')) {
    return REAL_ESTATE_LISTING_TYPE;
  }
  return 'gold_special'; // fallback seguro para inmobiliario
}

// -------------------------------------------------------------------------
// validateAndFixListing: detecta y corrige campos nulos/inválidos antes de
// publicar. Devuelve el resultado en el formato requerido por el contexto.
// -------------------------------------------------------------------------
export interface ValidationResult {
  valid: boolean;
  fixed_fields: Record<string, string | number | boolean>;
  errors: string[];
  ready_to_publish: boolean;
}

export function validateAndFixListing(
  listing: Partial<NuevaPropiedad> & {
    listing_type?: string | null;
    plan?: string | null;
    category_id?: string | null;
  }
): ValidationResult {
  const errors: string[] = [];
  const fixed_fields: Record<string, string | number | boolean> = {};

  // 1. listing_type
  let listing_type = listing.listing_type ?? null;
  if (!listing_type) {
    listing_type = inferListingType(listing.plan, listing.category_id);
    fixed_fields['listing_type_id'] = listing_type;
    errors.push(`listing_type era null; inferido como "${listing_type}" desde plan="${listing.plan ?? 'N/A'}" + category_id="${listing.category_id ?? 'N/A'}"`);
  }

  // 2. price
  if (!listing.precio || listing.precio <= 0) {
    errors.push('price es null o inválido (debe ser > 0)');
  }

  // 3. category
  if (!listing.category_id && !listing.tipoPropiedad) {
    errors.push('category_id y tipoPropiedad son null; no es posible determinar la categoría');
  }

  // 4. location
  if (!listing.direccion) {
    errors.push('location.address_line (direccion) es null');
  }
  if (!listing.region) {
    errors.push('location.state (region) es null');
  }
  if (!listing.comuna) {
    errors.push('location.city (comuna) es null');
  }

  const criticalErrors = errors.filter((e) =>
    e.includes('price') || e.includes('category') || e.includes('listing_type era null')
  );

  // El aviso está listo si los campos críticos se corrigieron o no tienen error
  const ready_to_publish =
    !!listing_type &&
    !!listing.precio &&
    listing.precio > 0 &&
    (!!listing.tipoPropiedad || !!listing.category_id);

  return {
    valid: criticalErrors.length === 0 || Object.keys(fixed_fields).length > 0,
    fixed_fields,
    errors,
    ready_to_publish,
  };
}

function getCategoryId(
  tipoPropiedad: NuevaPropiedad['tipoPropiedad'],
  tipoOperacion: NuevaPropiedad['tipoOperacion']
): string {
  const op = tipoOperacion ?? 'venta';
  const cat = tipoPropiedad ? CATEGORY_MAP[tipoPropiedad]?.[op] : undefined;
  // MLC157520 = Casa en Venta (categoría hoja válida, no MLC1459 que es un nodo padre)
  return cat ?? 'MLC157520';
}

function mapPropertyType(tipo: NuevaPropiedad['tipoPropiedad']): string {
  const map: Record<string, string> = {
    casa: 'Casa',
    departamento: 'Departamento',
    loft: 'Departamento', // ML CL no tiene atributo "Loft" separado
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

// Orden de intento para listing_type_id.
// Para venta: empezamos por 'free'. Para arriendo: 'free' no está disponible en
// categorías MLC18xxxx → empezamos en 'silver' para evitar intentos inútiles.
function getListingTypeFallbackOrder(tipoOperacion: string): string[] {
  if (tipoOperacion === 'arriendo') {
    return ['silver', 'gold', 'gold_special', 'gold_pro'];
  }
  return ['free', 'bronze', 'silver', 'gold', 'gold_special', 'gold_pro'];
}
const LISTING_TYPE_FALLBACK_ORDER = ['free', 'bronze', 'silver', 'gold', 'gold_special', 'gold_pro'];

// Detecta errores de listing_type no disponible para esta cuenta/categoría
function isListingTypeNullError(json: any): boolean {
  const msg: string = (json?.message ?? json?.error ?? '').toLowerCase();
  return (
    msg.includes('listing type was null') ||
    msg.includes('listing type') && msg.includes('not available') ||
    msg.includes('run out of this listing type')
  );
}

export async function publishProperty(
  data: NuevaPropiedad,
  accessToken: string
): Promise<PublishResult> {
  const attributes: Array<{ id: string; value_name?: string | number }> = [
    { id: 'OPERATION', value_name: data.tipoOperacion === 'venta' ? 'Venta' : 'Arriendo' },
    { id: 'PROPERTY_TYPE', value_name: mapPropertyType(data.tipoPropiedad) },
  ];

  // TOTAL_AREA y COVERED_AREA: value_type=number_unit → ML requiere value_name como string "N m²"
  // value_struct causa item.attribute.dropped (probado con API directa)
  if (data.superficieTotal && data.superficieTotal > 0) {
    attributes.push({ id: 'TOTAL_AREA', value_name: `${data.superficieTotal} m²` });
  }
  const coveredArea = (data.superficieUtil && data.superficieUtil > 0)
    ? data.superficieUtil
    : (data.superficieTotal && data.superficieTotal > 0 ? data.superficieTotal : null);
  if (coveredArea) {
    attributes.push({ id: 'COVERED_AREA', value_name: `${coveredArea} m²` });
  }
  // BEDROOMS: required para categorías de departamentos/casas — enviar siempre (0 es válido)
  attributes.push({ id: 'BEDROOMS', value_name: data.dormitorios ?? 0 });
  // Baños, estacionamientos y bodegas: valor entero, 0 es válido para ML
  attributes.push({ id: 'FULL_BATHROOMS', value_name: data.banos });
  attributes.push({ id: 'PARKING_LOTS',   value_name: data.estacionamientos });
  // WAREHOUSES: required en arriendo (MLC183186) — siempre enviar, 0 si no hay bodegas
  attributes.push({ id: 'WAREHOUSES', value_name: data.bodegas ?? 0 });
  // FURNISHED e IS_SUITABLE_FOR_PETS: required en arriendo (boolean) — siempre enviar
  attributes.push({ id: 'FURNISHED', value_name: data.amoblado ? 'Sí' : 'No' });
  attributes.push({ id: 'IS_SUITABLE_FOR_PETS', value_name: data.mascotas ? 'Sí' : 'No' });
  // MAINTENANCE_FEE: required en arriendo — si hay valor lo enviamos, si no 0 CLP
  const gastosComunes = data.gastosComunes && data.gastosComunes > 0 ? data.gastosComunes : 0;
  const monedaGastos = data.moneda === 'UF' ? 'UF' : 'CLP';
  attributes.push({ id: 'MAINTENANCE_FEE', value_name: `${gastosComunes} ${monedaGastos}` });
  // STATE y CITY van en location.state/city, NO en attributes
  if (data.orientacion) attributes.push({ id: 'ORIENTATION', value_name: data.orientacion });

  // Construir seller_contact sin campos undefined
  const sellerContact: Record<string, string> = {};
  if (data.nombreCorredor?.trim()) sellerContact.contact = data.nombreCorredor.trim();
  if (data.telefonoCorredor?.trim()) sellerContact.phone = data.telefonoCorredor.trim();
  if (data.whatsappActivo && data.whatsappNumero?.trim()) sellerContact.phone2 = data.whatsappNumero.trim();
  if (data.emailCorredor?.trim()) sellerContact.other_info = data.emailCorredor.trim();

  // Construir location con estructura que ML requiere (country + state + city)
  const location: Record<string, any> = {
    country: { id: 'CL' },
  };
  if (data.direccion?.trim()) location.address_line = data.direccion.trim();
  if (data.region?.trim()) location.state = { name: data.region.trim() };
  if (data.comuna?.trim()) location.city = { name: data.comuna.trim() };
  if (data.lat && data.lng) {
    location.geolocation = { latitude: data.lat, longitude: data.lng };
  }

  const pictures = data.fotos.filter((f) => f.mlId).map((f) => ({ id: f.mlId as string }));

  const categoryId = getCategoryId(data.tipoPropiedad, data.tipoOperacion);

  const baseBody: Record<string, any> = {
    title: data.titulo.trim(),
    category_id: categoryId,
    price: data.precio,
    currency_id: data.moneda === 'UF' ? 'CLF' : 'CLP',
    available_quantity: 1,
    buying_mode: 'classified',
    // Condición requerida por ML: viene del selector del formulario
    condition: data.condicion ?? 'not_specified',
    attributes,
  };

  if (pictures.length > 0) baseBody.pictures = pictures;
  if (Object.keys(location).length > 0) baseBody.location = location;
  if (Object.keys(sellerContact).length > 0) baseBody.seller_contact = sellerContact;

  try {
    // --- Listing type: si el usuario eligió uno, usarlo primero; si falla por tipo, hacer fallback ---
    let res: Response | null = null;
    let json: any = null;
    let usedListingType = 'free';

    // Si el usuario eligió un plan específico, intentarlo primero; luego el orden normal
    const fallbackOrder = getListingTypeFallbackOrder(data.tipoOperacion ?? 'venta');
    const orderToTry = data.listingType
      ? [data.listingType, ...fallbackOrder.filter((lt) => lt !== data.listingType)]
      : fallbackOrder;

    for (const lt of orderToTry) {
      const body = { ...baseBody, listing_type_id: lt };
      console.log('[ML publish] intentando listing_type_id:', lt, 'category:', categoryId);

      res = await fetch(`${ML_API_BASE}/items`, {
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

      // 402 = ítem creado pero requiere pago → tratar como éxito (el ítem queda publicado)
      if (res.status === 402) {
        json = await res.json();
        console.log('[ML publish] status 402 (publicado, pago requerido), id:', json?.id);
        usedListingType = lt;
        break;
      }

      json = await res.json();
      console.log('[ML publish] status:', res.status, 'lt:', lt, '|', JSON.stringify(json).slice(0, 300));

      // Si el error NO es de listing_type, salir del loop (es otro error o éxito)
      if (res.ok || !isListingTypeNullError(json)) {
        usedListingType = lt;
        break;
      }
      // Si es listing_type null → intentar con el siguiente tipo
      console.warn('[ML publish] listing_type_id', lt, 'rechazado, probando el siguiente...');
    }

    if (!res || (!res.ok && res.status !== 402)) {
      const cause = json?.cause?.[0]?.message ?? json?.cause?.[0]?.code ?? '';
      const msg = json?.message
        ? `${json.message}${cause ? ` (${cause})` : ''}`
        : json?.error ?? 'Error al publicar. Intenta nuevamente.';
      return { success: false, error: msg };
    }

    const itemId = json.id as string;

    // Publicar descripción por separado (ML requiere endpoint propio)
    if (data.descripcion?.trim()) {
      try {
        await fetch(`${ML_API_BASE}/items/${itemId}/description`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plain_text: data.descripcion.trim() }),
        });
      } catch {
        // No crítico, el item ya fue creado
      }
    }

    return { success: true, itemId, permalink: json.permalink };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error de conexión' };
  }
}

export async function uploadPhoto(
  uri: string,
  accessToken: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: uri.split('/').pop() ?? 'photo.jpg',
    } as any);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${ML_API_BASE}/pictures/items/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return;
      }

      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress(progress);
    };

    xhr.onerror = () => reject(new Error('Error de red al subir foto'));

    xhr.onload = () => {
      let json: any = null;

      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        json = null;
      }

      if (xhr.status === 401) {
        reject(new Error('TOKEN_EXPIRED'));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(json?.message ?? json?.error ?? 'Error al subir foto'));
        return;
      }

      onProgress?.(100);
      resolve(json.id as string);
    };

    xhr.send(formData);
  });
}

export async function getUserItems(
  userId: string,
  accessToken: string
): Promise<any[]> {
  const res = await fetch(
    `${ML_API_BASE}/users/${userId}/items/search?limit=50`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const ids: string[] = json.results ?? [];
  if (ids.length === 0) return [];

  const itemsRes = await fetch(`${ML_API_BASE}/items?ids=${ids.join(',')}&attributes=id,title,price,currency_id,thumbnail,status,permalink,location,attributes`, {
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

export async function relistItem(
  itemId: string,
  accessToken: string
): Promise<{ success: boolean; newId?: string; permalink?: string; error?: string }> {
  // ML endpoint para republicar un aviso cerrado
  // Mantiene fotos, título, precio y atributos del original
  const res = await fetch(`${ML_API_BASE}/items/${itemId}/relist`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listing_type_id: 'same' }),
  });
  const json = await res.json();
  if (!res.ok && res.status !== 402) {
    return { success: false, error: json?.message ?? 'Error al republicar' };
  }
  return { success: true, newId: json.id, permalink: json.permalink };
}
