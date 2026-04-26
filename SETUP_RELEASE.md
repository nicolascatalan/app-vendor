# Setup Guía: Preparación para Release - PropPublish MVP 1

**Objetivo**: Preparar la app para lanzamiento en App Store y Play Store
**Versión**: 1.0.0
**Fecha**: 16 de abril, 2026

---

## 📋 Pre-requisitos

### Sistema
- **macOS 12+** (para compilación iOS)
- **Node.js 18+** 
- **npm 8+**
- **Git**

### Cuentas Necesarias
- [ ] **Expo Account** (https://expo.dev) - para compilación en la nube
- [ ] **Apple Developer Account** ($99/año) - para App Store
- [ ] **Google Play Developer Account** ($25 único) - para Play Store
- [ ] **Google Cloud Project** - para Maps API y Play Store credentials

### Credenciales API
- [ ] **Google Maps API Key** - ya configurada en `app.json` extras
- [ ] **MercadoLibre App ID & Secret** - ya configurada en `app.json` extras

---

## 🔧 Step 1: Instalar EAS CLI

```bash
# Instalar globalmente
npm install -g eas-cli@latest

# Verificar instalación
eas --version
# Debe ser >= 5.1.0
```

---

## 🔐 Step 2: Configurar Credenciales

### 2.1 Login en Expo

```bash
eas login

# O si ya estás logueado:
eas whoami
```

### 2.2 Configurar Variables de Entorno

Crear archivo `~/.bash_profile` o `~/.zshrc` con:

```bash
# Google Maps
export GOOGLE_MAPS_API_KEY="AIzaSyD..."

# MercadoLibre
export ML_APP_ID="1234567..."
export ML_APP_SECRET="abc123..."
```

Luego:
```bash
source ~/.bash_profile  # o ~/.zshrc
```

Verificar:
```bash
echo $GOOGLE_MAPS_API_KEY
echo $ML_APP_ID
echo $ML_APP_SECRET
```

---

## 📱 Step 3: Configurar iOS para App Store

### 3.1 Apple Developer Account Setup

1. **Ir a Apple Developer**:
   - https://developer.apple.com/account/
   
2. **Registrar Bundle ID**:
   - Identifiers → App IDs → +
   - Bundle ID: `cl.propublish.app`
   - Capabilities: Camera, Photo Library, Location
   - Register

3. **Crear Certificado**:
   - Certificates → +
   - Type: "Apple Distribution"
   - Download y instalar en Keychain

### 3.2 Configurar en App Store Connect

1. **Ir a App Store Connect**:
   - https://appstoreconnect.apple.com/
   
2. **Crear App**:
   - My Apps → +
   - Name: "PropPublish"
   - Bundle ID: `cl.propublish.app`
   - Platform: iOS
   - SKU: `propublish-001`
   - User Access: Full Access

3. **Generar ASC App Password**:
   ```bash
   # En Apple ID account settings (appleid.apple.com):
   # Security → App-specific passwords → Generate
   # Copiar y guardar como:
   export ASC_APP_PASSWORD="abcd-efgh-ijkl-mnop"
   ```

4. **Completar Metadata**:
   - App Information → Name, Subtitle, Privacy Policy URL
   - Pricing and Availability → Escoger países
   - App Screenshots → Subir para cada tamaño
   - Description, Keywords, Support URL

### 3.3 Crear App Build en EAS

```bash
# Pre-checks
npm test
npx tsc --noEmit

# Build
eas build --platform ios --profile production --wait

# Esto puede tomar 10-15 minutos
```

### 3.4 Enviar a App Store Connect

```bash
# Exportar variables
export APPLE_ID="tu.email@icloud.com"
export ASC_APP_PASSWORD="abcd-efgh-ijkl-mnop"

# Submitir
eas submit --platform ios --profile production

# Estado
eas build:list
# Verificar en App Store Connect
```

---

## 🤖 Step 4: Configurar Android para Play Store

### 4.1 Google Play Developer Account

1. **Registrarse**:
   - https://play.google.com/console
   - Pagar $25 fee
   - Esperar 24-48 horas para activación

### 4.2 Crear Google Cloud Project

```bash
# 1. Ir a https://console.cloud.google.com
# 2. Create Project → "PropPublish"
# 3. Enable APIs:
#    - Google Play Developer API
#    - Google Play Android Developer API

# 4. Create Service Account:
#    - IAM & Admin → Service Accounts → Create
#    - Name: "propublish-eas"
#    - Grant Role: "Editor"
#    - Create Key → JSON → Download

# 5. Guardar archivo
mkdir -p ~/.eas
mv ~/Downloads/propublish-*.json ~/.eas/android-service-account.json
chmod 600 ~/.eas/android-service-account.json
```

### 4.3 Configurar Play Console

1. **Crear App**:
   - All Apps → Create App
   - Name: "PropPublish"
   - Default Language: Spanish
   - App Type: Free

2. **Configurar Package Name**:
   - App → Package Name: `com.propublish.app`
   - Target API Level: 33+

3. **Subir Firma (Key)**:
   - Setup → App Signing
   - Google gestiona las firmas automáticamente

4. **Completar Metadata**:
   - Store Listing → Title, Short Description
   - Screenshots → 2-8 por tipo
   - Category: Real Estate
   - Rating: Everyone

### 4.4 Crear Build Android

```bash
# Build
eas build --platform android --profile production --wait

# Esto puede tomar 15-20 minutos
```

### 4.5 Enviar a Play Store

```bash
# Exportar variable
export ANDROID_SERVICE_ACCOUNT_JSON="$HOME/.eas/android-service-account.json"

# Submitir a track "internal" (testing antes de público)
eas submit --platform android --profile production

# Verificar en Play Console
# Toma 2-4 horas para review
```

---

## ✅ Step 5: Pre-Release Checklist

### Antes de Build

- [ ] Versión actualizada en `app.json` (e.g., `1.0.0`)
- [ ] Todas las pruebas pasan: `npm test`
- [ ] TypeScript sin errores: `npx tsc --noEmit`
- [ ] No hay logs de debug en producción
- [ ] Permisos de usuario documentados en `app.json`
- [ ] Privacidad y términos listos
- [ ] Contacto de soporte configurado

### Antes de iOS Submission

- [ ] App Store Connect metadata completo
- [ ] Screenshots subidos (1-5 por tamaño)
- [ ] Release notes: v1.0.0 Initial Release
- [ ] Age Rating completado
- [ ] Privacy Policy URL válida
- [ ] Certificado Apple válido

### Antes de Android Submission

- [ ] Play Console app completa
- [ ] Screenshots subidos (2-8)
- [ ] Descripciones localizadas (al menos Spanish)
- [ ] Privacy Policy y ToS URLs
- [ ] App Icon 512x512 PNG
- [ ] Feature Graphic 1024x500

### Post-Submission

- [ ] Monitorear App Store Review (~24-48 horas)
- [ ] Monitorear Play Store Review (~2-4 horas)
- [ ] Preparar hotfix si hay rechazos
- [ ] Actualizar social media con links
- [ ] Setup analytics (opcional: Amplitude, Segment)

---

## 🚀 Comandos Rápidos

### Desarrollo
```bash
# Correr en Expo Go
npm start

# Correr tests
npm test -- --watch

# Build preview para testing
eas build --platform all --profile preview
```

### Producción
```bash
# Verificar todo está listo
./scripts/eas-build.sh check pre-build

# Bump version (ej: 1.0.0 → 1.0.1)
./scripts/eas-build.sh version bump 1.0.1

# Build producción
./scripts/eas-build.sh build prod all

# Submit a ambas stores
./scripts/eas-build.sh submit all

# Ver builds recientes
./scripts/eas-build.sh status list

# Descargar artefacto
./scripts/eas-build.sh status download <build-id>
```

---

## 📊 Monitoreo Post-Lanzamiento

### App Store
- https://appstoreconnect.apple.com/analytics/sales
- Ver: Downloads, Revenue, Crashes, Reviews

### Play Store
- https://play.google.com/console/u/0/developers/
- Ver: Downloads, Revenue, Crashes, Reviews, ANRs

### Analítica (Opcional)
- Agregardependencias: `@react-native-firebase/analytics` o similar
- Trackear: Signup, Login, Property Published, Errors

---

## 🐛 Troubleshooting Común

### "Build failed: Insufficient permissions"
**Solución**: Verificar que EAS está logueado
```bash
eas logout
eas login
```

### "iOS Certificate not found"
**Solución**: Regenerar certificados
```bash
eas build --platform ios --clear-cache
```

### "Android version code must be incremented"
**Solución**: Incrementar versionCode en app.json
```bash
./scripts/eas-build.sh version bump 1.0.1
```

### "App Store rejected: Missing privacy policy"
**Solución**: Agregar Privacy Policy URL en app.json o App Store Connect
```json
// app.json
{
  "expo": {
    "privacy": "https://propublish.app/privacy"
  }
}
```

---

## 📞 Soporte

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **Expo Forums**: https://forums.expo.dev

---

## 📌 Notas Importantes

⚠️ **Seguridad**:
- Nunca comitear credenciales a Git
- Usar `.env` local o EAS Secrets
- Regenerar API keys anualmente
- Mantener certificados en lugar seguro

⚠️ **Versioning**:
- iOS buildNumber ≠ Android versionCode
- Ambos deben incrementarse por cada build
- Usar SemVer para versión pública (1.0.0)

⚠️ **Testing**:
- Siempre testear en dispositivo físico primero
- Usar preview build antes de production
- Verificar permisos en Settings
- Simular lento de red

---

**Próximo paso**: Usar `./scripts/eas-build.sh build prod all` para compilar!

