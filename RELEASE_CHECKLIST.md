# PropPublish — Checklist pre-release MVP 1

## 1. Permisos declarados vs usados

### Declarados en `app.json`
- `CAMERA`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`
- `ACCESS_FINE_LOCATION`
- iOS: `NSCameraUsageDescription`
- iOS: `NSPhotoLibraryUsageDescription`
- iOS: `NSLocationWhenInUseUsageDescription`

### Usados realmente en el código
- Cámara y galería: `hooks/useImagePicker.ts`
- Ubicación en mapa / geocoding: `components/MapPicker.tsx`, `services/geocoding.ts`
- OAuth y almacenamiento seguro: `hooks/useAuth.ts`

### Observación
- No se detectó uso directo de micrófono, contactos, calendario ni background location.
- En Android moderno, `WRITE_EXTERNAL_STORAGE` puede ser innecesario según versión objetivo; revisar si Expo lo sigue requiriendo para el flujo final de fotos.

## 2. Variables de entorno

### Correctamente externalizadas
- `GOOGLE_MAPS_API_KEY`
- `ML_APP_ID`
- `ML_APP_SECRET`

### Dónde se consumen
- `app.json` → `expo.extra`
- `services/geocoding.ts`
- `hooks/useAuth.ts`
- `.env.example`

### Acción antes de release
- Confirmar que las 3 variables existen en `.env` local.
- Confirmar que también están creadas como EAS Secrets.
- Validar que la Redirect URI configurada en MercadoLibre sea `propublish://callback`.

## 3. Logs de consola

### Hallazgo
- Se detectó logging de auth en `hooks/useAuth.ts`.

### Estado
- Quedó protegido con `__DEV__`, por lo que no expone logs en producción.

## 4. Flujo crítico a probar manualmente

### Autenticación
- Login exitoso con cuenta Portal Inmobiliario / MercadoLibre.
- Recuperación de sesión al reabrir la app.
- Refresh de token después de expiración.
- Logout y limpieza de `SecureStore`.

### Nueva propiedad
- Paso 1: seleccionar operación y tipo de propiedad.
- Paso 2: región, comuna y ajuste manual de pin en mapa.
- Paso 3: campos condicionales para `departamento` y `arriendo`.
- Paso 4: tomar foto, elegir desde galería, reordenar, borrar, reintentar upload fallido.
- Paso 5: precio CLP/UF, validaciones y datos del corredor.
- Paso 6: preview, publicación exitosa y redirección al aviso.

### Listado
- Carga de publicaciones existentes.
- Activar / pausar aviso.
- Cerrar aviso.
- Pull to refresh.

## 5. Metadata para stores

### Nombre de la app
- `PropPublish`

### Subtítulo / descripción corta
- `Publica propiedades en Portal Inmobiliario desde tu celular`

### Descripción larga
- `PropPublish ayuda a corredores inmobiliarios a crear y publicar avisos de propiedades de forma rápida desde iPhone y Android. Completa datos, agrega fotos, ajusta la ubicación en el mapa y publica directamente en Portal Inmobiliario con integración basada en MercadoLibre.`

### Categoría sugerida
- `Negocios`
- Subcategoría sugerida: `Real Estate`

### Keywords ASO
- `portal inmobiliario, propiedades, corredor, corretaje, publicar inmueble, aviso inmobiliario, real estate chile, arriendo, venta, inmobiliaria`

## 6. Antes de compilar con EAS
- Ejecutar `npx tsc --noEmit`
- Ejecutar `npx expo start --clear` dentro de `app-vendor`
- Confirmar que los íconos existen en `assets/`
- Confirmar login OAuth real en dispositivo físico
- Probar permisos denegados y reapertura de Configuración
- Revisar respuesta real de publicación contra API de MercadoLibre antes de envío a stores
