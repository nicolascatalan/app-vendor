const path = require('path');

// Cargar variables de entorno desde .env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const {
  ML_APP_ID,
  ML_APP_SECRET,
  ML_REDIRECT_URI,
  ML_SCOPES,
  ML_USE_PKCE,
  GOOGLE_MAPS_API_KEY,
} = process.env;

module.exports = {
  expo: {
    name: 'PropPublish',
    slug: 'propublish',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    scheme: 'propublish',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0033A0',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'cl.propublish.app',
      infoPlist: {
        NSCameraUsageDescription:
          'PropPublish necesita acceso a la cámara para tomar fotos de la propiedad.',
        NSPhotoLibraryUsageDescription:
          'PropPublish necesita acceso a la galería para seleccionar fotos de la propiedad.',
        NSLocationWhenInUseUsageDescription:
          'PropPublish usa la ubicación para marcar la dirección exacta en el mapa.',
      },
    },
    android: {
      package: 'com.propublish.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0033A0',
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'propublish', host: 'callback' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-web-browser',
      ['expo-camera', { cameraPermission: 'PropPublish necesita acceso a la cámara para tomar fotos de la propiedad.' }],
      [
        'expo-image-picker',
        {
          photosPermission: 'PropPublish necesita acceso a tus fotos para publicar la propiedad.',
          cameraPermission: 'PropPublish necesita acceso a la cámara para tomar fotos.',
        },
      ],
      'expo-font',
    ],
    extra: {
      eas: {
        projectId: 'cc29e7e8-33e4-4118-b2db-1c4cac5fea2b',
      },
      GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY ?? '',
      ML_APP_ID: ML_APP_ID ?? '',
      ML_APP_SECRET: ML_APP_SECRET ?? '',
      ML_REDIRECT_URI: ML_REDIRECT_URI ?? '',
      ML_SCOPES: ML_SCOPES ?? 'read write',
      ML_USE_PKCE: ML_USE_PKCE ?? 'false',
    },
  },
};
