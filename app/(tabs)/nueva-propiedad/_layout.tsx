import React from 'react';
import { Stack } from 'expo-router';

export default function NuevaPropiedadLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0033A0' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tipo de propiedad' }} />
      <Stack.Screen name="ubicacion" options={{ title: 'Ubicación' }} />
      <Stack.Screen name="caracteristicas" options={{ title: 'Características' }} />
      <Stack.Screen name="fotos" options={{ title: 'Fotos' }} />
      <Stack.Screen name="descripcion" options={{ title: 'Precio y descripción' }} />
      <Stack.Screen name="preview" options={{ title: 'Vista previa' }} />
    </Stack>
  );
}
