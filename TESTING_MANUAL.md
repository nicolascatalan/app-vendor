# 🧪 Guía de Testing Manual - PropPublish MVP 1

**Fecha**: 16 de abril, 2026  
**Versión**: 1.0.0  
**Plataformas**: iOS y Android  

---

## 📋 Alcances de la Aplicación

### 1️⃣ Autenticación (Pantalla: Login)
**Qué puede hacer:**
- ✅ Autenticarse con MercadoLibre usando OAuth2 (PKCE flow)
- ✅ Guardar credenciales de forma segura (expo-secure-store)
- ✅ Mantener sesión activa entre reinicios
- ✅ Cerrar sesión y limpiar datos

**Alcances:**
- Usuarios de MercadoLibre Chile (ML.cl)
- Autenticación web redirect
- Token refresh automático

---

### 2️⃣ Formulario de Propiedad (Pantalla: Nueva Propiedad)
**Estructura del formulario en 6 pasos:**

#### Paso 1: Tipo de Propiedad
- Departamento
- Casa
- Local comercial
- Terreno

#### Paso 2: Ubicación
- Búsqueda por dirección con Google Places
- Mapa interactivo con pin draggable
- Geocoding en tiempo real
- Filtrado por comunas de Chile
- Coordenadas exactas (lat/long)

#### Paso 3: Características
**Para Departamento/Casa:**
- Cantidad de dormitorios (1-5+)
- Cantidad de baños (1-3+)
- Área total (m²)
- Área útil (m²)
- Pisos en el edificio
- Piso del inmueble

**Para Local Comercial:**
- Área total (m²)

**Para Terreno:**
- Área total (m²)
- Frente (metros)

#### Paso 4: Descripción
- Título (obligatorio)
- Descripción detallada
- Tipo de propiedad condicional

#### Paso 5: Fotos
- Seleccionar múltiples fotos de galería
- Compresión automática (iterativa JPEG)
- Progress de subida por foto
- Reordenamiento de fotos
- Eliminar fotos

#### Paso 6: Precio & Publicación
- Moneda: CLP o UF (toggle)
- Precio mensual (Arriendo) o venta
- Validación de campos completos
- Preview de lo que se publicará
- Publicar en MercadoLibre

---

### 3️⃣ Gestión de Publicaciones (Pantalla: Perfil)
**Qué puede hacer:**
- ✅ Ver lista de propiedades publicadas
- ✅ Ver estado de cada propiedad (activa/pausada/eliminada)
- ✅ Pausar publicaciones
- ✅ Activar publicaciones pausadas
- ✅ Eliminar publicaciones
- ✅ Ver detalles: precio, ubicación, fotos
- ✅ Ver link a MercadoLibre

---

## 🧬 Características Técnicas Implementadas

### Estado Persistente
- Zustand store con AsyncStorage
- Datos se guardan automáticamente
- Se restauran al reiniciar app

### Validación
- Campos obligatorios validados
- Formatos de números validados
- URLs de imágenes validadas
- Checklist visual pre-publicación

### Manejo de Errores
- Network errors capturados
- Token expired fallback
- Error messages amigables
- Retry logic para uploads

### Permisos Necesarios
- Cámara (para fotos)
- Galería/Files (para seleccionar fotos)
- Ubicación (para Google Maps - opcional)

---

## 🧪 Plan de Testing Manual

### ✅ FASE 1: Autenticación (15-20 minutos)

#### Test 1.1: Login correcto
- [ ] Abrir app en iPhone/Android
- [ ] Pantalla de login carga
- [ ] Clickear "Conectar con MercadoLibre"
- [ ] Redirige a web de MercadoLibre
- [ ] Ingresa credenciales de test ML
- [ ] Acepta permisos
- [ ] Redirige a tabs (home)
- [ ] Sesión persiste al reiniciar app

#### Test 1.2: Logout
- [ ] Ir a Perfil
- [ ] Clickear botón de logout
- [ ] Sesión se limpia
- [ ] Redirige a login
- [ ] Datos locales se borran

#### Test 1.3: Token expirado
- [ ] Simular token expirado en el código (TBD)
- [ ] Intentar publishar propiedad
- [ ] App detecta token expirado
- [ ] Redirige a login automáticamente

---

### ✅ FASE 2: Crear Nueva Propiedad (45-60 minutos)

#### Test 2.1: Departamento - Flujo Completo
**Paso 1 - Tipo:**
- [ ] Seleccionar "Departamento"
- [ ] Botón siguiente activo
- [ ] Continuar

**Paso 2 - Ubicación:**
- [ ] Buscar dirección (ej: "Las Condes, Santiago")
- [ ] Suggestions aparecen
- [ ] Seleccionar una dirección
- [ ] Mapa centra en ubicación
- [ ] Latitud/Longitud se actualizan
- [ ] Draggable pin funciona
- [ ] Continuar

**Paso 3 - Características:**
- [ ] Ingresar: 3 dormitorios, 2 baños
- [ ] Ingresar: 120 m² total, 100 m² útil
- [ ] Ingresar: 8 pisos en edificio, piso 3
- [ ] Valores se guardan
- [ ] Continuar

**Paso 4 - Descripción:**
- [ ] Título: "Hermoso departamento en Las Condes"
- [ ] Descripción: "Ubicado en sector tranquilo, cerca de metroplus..."
- [ ] Continuar

**Paso 5 - Fotos:**
- [ ] Clickear "Agregar fotos"
- [ ] Seleccionar 3-5 fotos de galería
- [ ] Fotos aparecen en grid
- [ ] Compresión ocurre (check por tamaño de archivo)
- [ ] Reordear fotos (drag & drop)
- [ ] Eliminar foto (swipe/botón)
- [ ] Continuar

**Paso 6 - Precio & Publicación:**
- [ ] Moneda: CLP (default)
- [ ] Precio: $3,500,000 (venta)
- [ ] Preview checklist completo ✓
- [ ] Clickear "Publicar"
- [ ] Loading... (max 30 segundos)
- [ ] Success message con link a ML
- [ ] Propiedad aparece en Perfil/Publicaciones

#### Test 2.2: Casa - Flujo Rápido
- [ ] Repetir Test 2.1 pero:
  - Seleccionar "Casa"
  - Agregar 4 dormitorios, 3 baños
  - Ingresar ubicación diferente
  - Menos fotos (2-3)
  - Precio en UF (toggle moneda)

#### Test 2.3: Local Comercial
- [ ] Seleccionar "Local comercial"
- [ ] Paso 3: Solo área total (ej: 50 m²)
- [ ] Otros pasos: igual
- [ ] Publicar en arriendo ($2,000/mes en CLP)

#### Test 2.4: Terreno
- [ ] Seleccionar "Terreno"
- [ ] Paso 3: Área 500 m², frente 20m
- [ ] Publicar en venta (UF)

#### Test 2.5: Validaciones
- [ ] Intentar ir al Paso 2 sin seleccionar tipo → Error
- [ ] Intentar ir al Paso 3 sin ubicación → Error
- [ ] Intentar publicar sin fotos → Error
- [ ] Intentar publicar sin título → Error
- [ ] Intentar publicar con precio = 0 → Error

#### Test 2.6: Persistencia de datos
- [ ] Crear propiedad hasta Paso 3
- [ ] Cerrar app completamente
- [ ] Reabrir app
- [ ] Ir a "Nueva propiedad"
- [ ] ¡Datos del Paso 3 se mantienen!
- [ ] Continuar desde donde se dejó

#### Test 2.7: Cancelar & Reset
- [ ] Crear propiedad parcialmente
- [ ] Clickear botón atrás/cancelar
- [ ] Confirmar que cancela
- [ ] Datos se limpian
- [ ] Volver a empezar limpio

---

### ✅ FASE 3: Gestión de Publicaciones (30-40 minutos)

#### Test 3.1: Ver publicaciones
- [ ] Ir a Perfil / tab "Publicaciones"
- [ ] Lista de propiedades publicadas aparece
- [ ] Cada propiedad muestra:
  - [ ] Foto principal
  - [ ] Título
  - [ ] Precio
  - [ ] Ubicación
  - [ ] Estado (Activa ✓ / Pausada ⏸)
  - [ ] 3 botones: Ver, Pausar/Activar, Eliminar

#### Test 3.2: Pausar publicación
- [ ] Clickear botón "Pausar" en propiedad activa
- [ ] Confirmación: "¿Pausar esta publicación?"
- [ ] [ ] Aceptar
- [ ] Estado cambia a "Pausada ⏸"
- [ ] Botón ahora dice "Activar"

#### Test 3.3: Activar publicación
- [ ] Clickear "Activar" en propiedad pausada
- [ ] Estado cambia a "Activa ✓"
- [ ] Vuelve a ser visible en ML

#### Test 3.4: Eliminar publicación
- [ ] Clickear "Eliminar" en cualquier propiedad
- [ ] Confirmación: "¿Eliminar permanentemente?"
- [ ] [ ] Aceptar
- [ ] Propiedad desaparece de la lista
- [ ] En ML: marca como Eliminada

#### Test 3.5: Ver detalles
- [ ] Clickear en propiedad (foto o título)
- [ ] Abre modal/pantalla con detalles:
  - [ ] Galería de fotos (swipe)
  - [ ] Información completa (tipo, dormitorios, baños, etc.)
  - [ ] Botón "Ver en MercadoLibre" → abre URL
  - [ ] Botón cerrar

#### Test 3.6: Actuar sobre publicación en ML
- [ ] Pausar/activar en app
- [ ] Esperar 30 segundos
- [ ] Verificar en mercadolibre.com.ar que cambió estado
- [ ] Eliminar en app
- [ ] Verificar en ML que desapareció

---

### ✅ FASE 4: Manejo de Errores (20-30 minutos)

#### Test 4.1: Sin conexión a internet
- [ ] Activar "Airplane Mode" en settings
- [ ] Intentar crear propiedad
- [ ] Intentar buscar dirección → Error "Sin conexión"
- [ ] Desactivar Airplane Mode
- [ ] Buscar dirección → Funciona
- [ ] Permitir datos nuevamente

#### Test 4.2: Upload de fotos lento
- [ ] Simulador: bajar speed a 2G (Settings dev)
- [ ] Agregar 5 fotos
- [ ] Observar progress bar
- [ ] Esperar a que complete
- [ ] Puede cancelar mid-upload (TBD)

#### Test 4.3: API Error (MercadoLibre)
- [ ] Publicar propiedad
- [ ] Simular API error (mock en código)
- [ ] Error message amigable aparece
- [ ] Botón "Reintentar"
- [ ] Clickear reintentar → Intenta de nuevo

#### Test 4.4: Foto muy grande
- [ ] Agregar foto de 20MB+
- [ ] App debe comprimir automáticamente
- [ ] Tamaño final debe ser < 5MB
- [ ] Foto se sube correctamente

#### Test 4.5: Foto sin permiso
- [ ] Denegar permiso a galería
- [ ] Intentar agregar foto → Popup permiso
- [ ] "Deny" → Error "Permiso requerido"
- [ ] "Allow" → Permite seleccionar

---

### ✅ FASE 5: UI/UX (20-30 minutos)

#### Test 5.1: Responsive design
- [ ] iPhone SE (pequeño)
- [ ] iPhone 14 Pro (grande)
- [ ] Android (pequeño y grande)
- [ ] **Verificar:**
  - [ ] Texto legible
  - [ ] Botones clickeables
  - [ ] Fotos visibles
  - [ ] Inputs accesibles
  - [ ] Sin overflow de contenido

#### Test 5.2: Dark mode
- [ ] Activar dark mode en settings
- [ ] App debería cambiar colores
- [ ] Verificar contraste y legibilidad
- [ ] Desactivar dark mode
- [ ] Vuelve a light mode

#### Test 5.3: Loading states
- [ ] Buscar dirección → "Loading..."
- [ ] Subir propiedad → "Publicando... 0%"
- [ ] Simular delay (2-3 seg)
- [ ] Estados se muestran correctamente

#### Test 5.4: Teclado
- [ ] Ingresar título → Teclado aparece
- [ ] Ingresar precio → Teclado numérico (iOS) o numeric (Android)
- [ ] Descartar teclado → Touch fuera del input
- [ ] Inputs no quedan ocultos bajo teclado

#### Test 5.5: Navegación
- [ ] Tabs cambiam correctamente (Home, Nueva Propiedad, Perfil)
- [ ] Botones atrás funcionan
- [ ] State se preserva al cambiar tabs
- [ ] Deep links funcionan (TBD)

---

### ✅ FASE 6: Performance (15-20 minutos)

#### Test 6.1: Velocidad de formulario
- [ ] Ingresar datos rápidamente
- [ ] No debe lag
- [ ] Transiciones suaves
- [ ] Tapping responsive

#### Test 6.2: Listado de publicaciones
- [ ] 5 publicaciones → rápido
- [ ] 20 publicaciones → debe scrollear suave
- [ ] Si hay muchas: lazy loading o pagination (TBD)

#### Test 6.3: Memoria
- [ ] Crear/eliminar 10 propiedades
- [ ] App no debería crescer exponencialmente en tamaño
- [ ] No crashes por memory
- [ ] Profiler: memory < 100MB

#### Test 6.4: Tamaño de app
- [ ] iOS: ~150-200MB IPA
- [ ] Android: ~120-150MB APK
- [ ] Dentro de límites razonables

---

### ✅ FASE 7: Seguridad (10-15 minutos)

#### Test 7.1: Credenciales
- [ ] Token debe estar en secure storage (NO en localStorage)
- [ ] Token NO debe loguearse en console
- [ ] Token NO debe aparecer en URL
- [ ] Verificar en Debugger: no visible

#### Test 7.2: HTTPS
- [ ] Todas las API calls → HTTPS (NO HTTP)
- [ ] Google Maps API → HTTPS
- [ ] MercadoLibre OAuth → HTTPS
- [ ] Certificado válido

#### Test 7.3: Logout limpia todo
- [ ] Logout
- [ ] Verificar AsyncStorage vacío
- [ ] Verificar token eliminado
- [ ] Cache de fotos: ¿limpiado? (TBD)

#### Test 7.4: Input sanitization
- [ ] Ingresar "<script>" en título → Debe escapar/sanitizar
- [ ] Ingresar HTML en descripción → Debe mostrar como texto
- [ ] No debe haber XSS vulnerabilities

---

## 📊 Checklist Resumido

### Autenticación
- [ ] Login con ML
- [ ] Logout
- [ ] Token refresh
- [ ] Persistencia

### Crear Propiedad
- [ ] 4 tipos: Dpto, Casa, Local, Terreno
- [ ] 6 pasos funcionales
- [ ] Validaciones funcionan
- [ ] Fotos se comprimen
- [ ] Publicación exitosa

### Gestionar Publicaciones
- [ ] Listar propiedades
- [ ] Pausar/Activar
- [ ] Eliminar
- [ ] Ver detalles
- [ ] Sincronización con ML

### Errores
- [ ] Sin conexión
- [ ] Upload lento
- [ ] API errors
- [ ] Permisos

### UX
- [ ] Responsive
- [ ] Dark mode
- [ ] Loading states
- [ ] Teclado behaves
- [ ] Navegación smooth

### Performance
- [ ] Rápido
- [ ] Sin lags
- [ ] Bajo memory
- [ ] Tamaño app OK

### Seguridad
- [ ] Credenciales seguras
- [ ] HTTPS
- [ ] Input sanitization
- [ ] No exposición de tokens

---

## 🚀 Comando para Testear

```bash
# Desarrollo (iOS)
cd /Users/ncatalan/Documents/Proyect/app-vendor
npm install
npx expo start --clear
# Presionar 'i' para iOS Simulator

# Desarrollo (Android)
npx expo start --clear
# Presionar 'a' para Android Emulator

# Pruebas unitarias
npm test

# Pruebas con coverage
npm test -- --coverage

# Build para testing (preview)
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

---

## 📝 Notas

- **Tiempo estimado**: 3-4 horas de testing completo
- **Reportar bugs**: Screenshot + pasos para reproducir
- **Success criteria**: Todos los checkboxes ✓
- **Go-live**: Después de esta fase de testing

---

**Actualizado**: 16 de abril, 2026
