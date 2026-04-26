# EAS Build & Submission Guide - PropPublish MVP 1

**Última actualización**: 16 de abril, 2026
**Estado**: Configurado y listo para compilación
**Versión**: 1.0.0

## Tabla de Contenidos
1. [Estructura EAS](#estructura-eas)
2. [Variables de Entorno](#variables-de-entorno)
3. [Compilación](#compilación)
4. [Submission a Stores](#submission-a-stores)
5. [Troubleshooting](#troubleshooting)

---

## Estructura EAS

### Build Profiles

#### Development (`development`)
```json
{
  "developmentClient": true,
  "distribution": "internal",
  "channel": "development"
}
```
- **Uso**: Compilación local con Expo Go
- **Distribución**: Interna (no publicada)
- **Comando**: `eas build --platform ios --profile development`

#### Preview (`preview`)
```json
{
  "distribution": "internal",
  "channel": "preview"
}
```
- **Uso**: Testing interno antes de producción
- **Distribución**: Enlace interno (QR/email)
- **Comando**: `eas build --platform ios --profile preview`

#### Production (`production`)
```json
{
  "distribution": "store",
  "channel": "production"
}
```
- **Uso**: Compilación para App Store & Play Store
- **Distribución**: Tienda oficial
- **Comando**: `eas build --platform ios --profile production`

---

## Variables de Entorno

### Requeridas para Compilación

```bash
# Google Maps API
export GOOGLE_MAPS_API_KEY="AIza..."

# MercadoLibre OAuth
export ML_APP_ID="12345678..."
export ML_APP_SECRET="abc123..."
```

**Ubicación en EAS**: `app.json` extras (líneas 62-64)

### Requeridas para Submission a Stores

#### iOS (App Store)
```bash
# Apple Developer Account
export APPLE_ID="tu.email@icloud.com"
export ASC_APP_PASSWORD="abcd-efgh-ijkl-mnop"  # App-specific password
export ASC_APP_ID="6477234567"                  # Bundle ID en App Store Connect
```

⚠️ **Nota**: `ASC_APP_PASSWORD` NO es tu contraseña iCloud. Debes generar una contraseña de aplicación en https://appleid.apple.com/account/manage.

#### Android (Play Store)
```bash
# Google Play Service Account
export ANDROID_SERVICE_ACCOUNT_JSON="/path/to/service-account.json"
```

**Pasos para obtener**:
1. Ve a https://console.cloud.google.com
2. Crear proyecto "PropPublish"
3. Habilitar Google Play Developer API
4. Crear Service Account con rol "Editor"
5. Descargar JSON key → guardar en `~/.eas/android-service-account.json`

---

## Compilación

### Pre-requisitos

```bash
# 1. Verificar versión EAS CLI
eas --version  # Debe ser >= 5.1.0

# 2. Login en EAS
eas login
# Ingresa credenciales Expo.dev

# 3. Verificar configuración
eas build --platform ios --profile production --dry-run
```

### Flujo de Compilación

#### iOS
```bash
# Compilación única
eas build --platform ios --profile production

# Compilación y esperar resultado
eas build --platform ios --profile production --wait

# Ver logs en tiempo real
eas build --platform ios --profile production --tail
```

#### Android
```bash
# Compilación única
eas build --platform android --profile production

# Compilación universal (iOS + Android)
eas build --platform all --profile production
```

#### Monitoreo
```bash
# Ver builds activos
eas build:list

# Ver detalles de build específico
eas build:view <build-id>

# Descargar artefacto
eas build:download <build-id> --path ./build-output
```

---

## Submission a Stores

### 1. Submission a App Store (iOS)

#### Configuración en EAS

El archivo `eas.json` contiene:
```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "6477234567",
      "appleId": "${APPLE_ID}",
      "ascAppPassword": "${ASC_APP_PASSWORD}"
    }
  }
}
```

#### Pasos

```bash
# 1. Generar build para App Store
eas build --platform ios --profile production --wait

# 2. Preparar credenciales
export APPLE_ID="tu.email@icloud.com"
export ASC_APP_PASSWORD="abcd-efgh-ijkl-mnop"

# 3. Submitir a App Store
eas submit --platform ios --profile production

# 4. Verificar estado en App Store Connect
# https://appstoreconnect.apple.com
```

**Validaciones automáticas en App Store**:
- ✅ Bundle ID correcto
- ✅ Versión build incrementada
- ✅ Screenshots y descripción (complétalos en Connect)
- ✅ Edad mínima y categorías
- ✅ Certificados y provisioning profiles

### 2. Submission a Play Store (Android)

#### Configuración en EAS

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "${ANDROID_SERVICE_ACCOUNT_JSON}",
      "track": "internal",
      "releaseStatus": "draft"
    }
  }
}
```

#### Pasos

```bash
# 1. Generar build para Play Store (APK)
eas build --platform android --profile production --wait

# 2. Preparar credenciales
export ANDROID_SERVICE_ACCOUNT_JSON="$HOME/.eas/android-service-account.json"

# 3. Submitir a Play Store
eas submit --platform android --profile production

# 4. Verificar en Play Console
# https://play.google.com/console
```

**Nota**: Track `internal` es para testing antes de lanzamiento público. Cambiar a `production` cuando esté listo.

---

## Metadata y Store Listings

### iOS App Store Connect

Completar ANTES de first submission:

```
Bundle ID: cl.propublish.app
Version: 1.0.0

Screenshots (mínimo 1 por tamaño):
  - iPhone 6.7" (1284×2778): Home, Map, Form steps
  
Description:
  "Publica propiedades en Mercado Libre directamente desde tu teléfono.
   Foto, ubicación, características y descripciones - todo en una app."

Keywords: propiedad, inmuebles, mercado libre, publicar, vender

Support URL: https://propublish.app/support (o email)

App Category: Real Estate
Age Rating: 4+
```

### Google Play Store

Completar en Play Console:

```
Package Name: com.propublish.app
Version: 1.0.0

Screenshots (mínimo 2):
  - 1080×1920: Home, Map, Form
  
Short description:
  "Publica propiedades en ML desde tu móvil"

Full description:
  "Publica propiedades en Mercado Libre directamente desde tu teléfono..."

Category: Real Estate
Rating: Everyone
Content Rating: Complete questionnaire
```

---

## Versioning & Updates

### Incrementar Versión

```json
// app.json
{
  "expo": {
    "version": "1.0.1",  // Cambiar aquí
    "ios": {
      "buildNumber": "2"   // Incrementar para cada iOS build
    },
    "android": {
      "versionCode": 2     // Incrementar para cada Android build
    }
  }
}
```

### Changelog para Stores

**Release Notes Template**:
```
## v1.0.1 - 2026-04-20
- ✨ Autocompletado de ubicación con Google Maps
- 🐛 Corregir problema con carga de fotos
- 📸 Optimización de compresión de imágenes

## v1.0.0 - 2026-04-16
- 🚀 Lanzamiento inicial
- Autenticación con MercadoLibre OAuth
- Publicación de propiedades en 6 pasos
- Galería de fotos con progreso de upload
- Gestión de publicaciones
```

---

## Troubleshooting

### Build Fails

#### Error: "Provisioning Profile Not Found"
```bash
# Solución: Regenerar certificados
eas build --platform ios --profile production --clear-cache

# O resetear credenciales locales
rm ~/.eas/credentials.json
eas build --platform ios --profile production
```

#### Error: "Android build failed: Permission denied"
```bash
# Verificar que service account tiene permisos
chmod 600 ~/.eas/android-service-account.json

# Verificar que cuenta es Admin en Play Console
# https://play.google.com/console/settings/service-accounts
```

### Submission Fails

#### Error: "Bundle version already exists"
```bash
# Incrementar buildNumber en app.json
"ios": {
  "buildNumber": "3"  // Cambiar de "2" a "3"
}

# Luego compilar nuevamente
eas build --platform ios --profile production --wait
eas submit --platform ios --profile production
```

#### Error: "Invalid credentials"
```bash
# Verificar que variables están seteadas
echo $APPLE_ID
echo $ASC_APP_PASSWORD

# Si están vacías, setearlas nuevamente
export APPLE_ID="..."
export ASC_APP_PASSWORD="..."
```

---

## Checklist Pre-Release

### Antes de compilación (`eas build`)
- [ ] Versión bumped en app.json
- [ ] GOOGLE_MAPS_API_KEY seteada
- [ ] ML_APP_ID y ML_APP_SECRET seteadas
- [ ] `npm test` pasando (25 tests)
- [ ] `npx tsc --noEmit` sin errores
- [ ] No hay console.log en código productivo
- [ ] Permissions solicitadas correctamente (ver app.json infoPlist)

### Antes de submission (`eas submit`)
- [ ] Build completado y descargado
- [ ] iOS: Apple ID y ASC_APP_PASSWORD configuradas
- [ ] Android: service-account.json disponible
- [ ] Metadata completa en Connect/Console
- [ ] Screenshots subidos (mínimo 1-2 por plataforma)
- [ ] Release notes documentadas

### Post-submission
- [ ] Monitorear App Store Review (iOS: 1-2 días)
- [ ] Monitorear Play Store Review (Android: 2-4 horas)
- [ ] Responder a feedback de revisores
- [ ] Estar atento a crashes reportados
- [ ] Plan de actualizaciones futuras

---

## Recursos

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **Expo Community**: https://forums.expo.dev

---

## Notas Importantes

⚠️ **Credenciales**:
- Nunca commitear variables de entorno a git
- Usar `.env` local o eas secrets
- Regenerar service accounts cada 90 días

⚠️ **Certificados**:
- iOS: Válidos por 1 año (auto-renovados por EAS)
- Android: Clave de firma necesaria (guardar en lugar seguro)

⚠️ **Testing**:
- Usar "preview" build antes de "production"
- Testear en dispositivo físico
- Validar permisos en Settings

---

**Última actualización**: Sprint 8 (Testing)  
**Próximo**: Sprint 9 (Manual QA & Beta)
