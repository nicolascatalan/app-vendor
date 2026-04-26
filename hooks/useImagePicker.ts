import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Linking } from 'react-native';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  size?: number;
}

const MAX_DIMENSION = 1920;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_SELECTION = 20;
const COMPRESSION_STEPS = [0.82, 0.7, 0.58, 0.46, 0.34];

async function getFileSize(uri: string): Promise<number | undefined> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return undefined;
  }
}

function getResizeActions(width?: number, height?: number) {
  if (!width || !height) {
    return [{ resize: { width: MAX_DIMENSION } }];
  }

  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_DIMENSION) {
    return [];
  }

  return width >= height
    ? [{ resize: { width: MAX_DIMENSION } }]
    : [{ resize: { height: MAX_DIMENSION } }];
}

async function compressImage(
  uri: string,
  width?: number,
  height?: number,
  originalSize?: number
): Promise<PickedImage> {
  const resizeActions = getResizeActions(width, height);
  const currentSize = originalSize ?? (await getFileSize(uri));

  if (currentSize && currentSize <= MAX_BYTES && resizeActions.length === 0) {
    return {
      uri,
      width: width ?? 0,
      height: height ?? 0,
      size: currentSize,
    };
  }

  let bestResult: PickedImage | null = null;

  for (const compress of COMPRESSION_STEPS) {
    const result = await ImageManipulator.manipulateAsync(uri, resizeActions, {
      compress,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const size = await getFileSize(result.uri);
    bestResult = {
      uri: result.uri,
      width: result.width,
      height: result.height,
      size,
    };

    if (!size || size <= MAX_BYTES) {
      return bestResult;
    }
  }

  return bestResult ?? {
    uri,
    width: width ?? 0,
    height: height ?? 0,
    size: currentSize,
  };
}

function showPermissionAlert(message: string) {
  Alert.alert('Permiso requerido', message, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Abrir Configuración',
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
}

async function requestCameraPermission(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    showPermissionAlert(
      'PropPublish necesita acceso a la cámara. Ve a Configuración > Privacidad para activarlo.'
    );
  }

  return status === 'granted';
}

async function requestGalleryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    showPermissionAlert(
      'PropPublish necesita acceso a tu galería. Ve a Configuración > Privacidad para activarlo.'
    );
  }

  return status === 'granted';
}

export function useImagePicker() {
  const pickFromGallery = async (): Promise<PickedImage[]> => {
    const granted = await requestGalleryPermission();
    if (!granted) {
      throw new Error(
        'Permiso denegado. Ve a Configuración > Privacidad para activar el acceso a la galería.'
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: MAX_SELECTION,
    });

    if (result.canceled) {
      return [];
    }

    return await Promise.all(
      result.assets.slice(0, MAX_SELECTION).map((asset) =>
        compressImage(asset.uri, asset.width, asset.height, asset.fileSize)
      )
    );
  };

  const pickFromCamera = async (): Promise<PickedImage | null> => {
    const granted = await requestCameraPermission();
    if (!granted) {
      throw new Error(
        'Permiso denegado. Ve a Configuración > Privacidad para activar el acceso a la cámara.'
      );
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return await compressImage(asset.uri, asset.width, asset.height, asset.fileSize);
  };

  return { pickFromGallery, pickFromCamera };
}
