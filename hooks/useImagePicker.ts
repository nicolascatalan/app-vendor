import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  size?: number;
}

const MAX_DIMENSION = 1920;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

async function compressImage(uri: string): Promise<PickedImage> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

async function requestGalleryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      selectionLimit: 20,
    });

    if (result.canceled) return [];

    const compressed = await Promise.all(result.assets.map((a) => compressImage(a.uri)));
    return compressed;
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

    if (result.canceled) return null;

    const compressed = await compressImage(result.assets[0].uri);
    return compressed;
  };

  return { pickFromGallery, pickFromCamera };
}
