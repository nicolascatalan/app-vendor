import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FotoItem {
  uri: string;
  mlId?: string;
  uploading?: boolean;
  uploadError?: boolean;
}

export interface NuevaPropiedad {
  // Paso 1
  tipoOperacion: 'venta' | 'arriendo' | null;
  tipoPropiedad:
    | 'casa'
    | 'departamento'
    | 'oficina'
    | 'local'
    | 'terreno'
    | 'bodega'
    | 'estacionamiento'
    | 'parcela'
    | null;

  // Paso 2
  region: string | null;
  comuna: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;

  // Paso 3
  superficieTotal: number | null;
  superficieUtil: number | null;
  dormitorios: number;
  banos: number;
  estacionamientos: number;
  bodegas: number;
  piso: number | null;
  pisosEdificio: number | null;
  antiguedad: string | null;
  amoblado: boolean;
  mascotas: boolean;
  orientacion: string | null;
  gastosComunes: number | null;
  contribuciones: number | null;

  // Paso 4
  fotos: FotoItem[];

  // Paso 5
  titulo: string;
  descripcion: string;
  precio: number | null;
  moneda: 'CLP' | 'UF';

  // Corredor
  nombreCorredor: string;
  telefonoCorredor: string;
  whatsappActivo: boolean;
  whatsappNumero: string;
  emailCorredor: string;
}

interface NuevaPropiedadActions {
  setField: <K extends keyof NuevaPropiedad>(key: K, value: NuevaPropiedad[K]) => void;
  resetForm: () => void;
  setFotos: (fotos: FotoItem[]) => void;
  addFoto: (foto: FotoItem) => void;
  removeFoto: (uri: string) => void;
  reorderFotos: (fotos: FotoItem[]) => void;
  updateFotoMlId: (uri: string, mlId: string) => void;
  setFotoUploading: (uri: string, uploading: boolean) => void;
  setFotoUploadError: (uri: string, error: boolean) => void;
}

const initialState: NuevaPropiedad = {
  tipoOperacion: null,
  tipoPropiedad: null,
  region: null,
  comuna: null,
  direccion: null,
  lat: null,
  lng: null,
  superficieTotal: null,
  superficieUtil: null,
  dormitorios: 0,
  banos: 0,
  estacionamientos: 0,
  bodegas: 0,
  piso: null,
  pisosEdificio: null,
  antiguedad: null,
  amoblado: false,
  mascotas: false,
  orientacion: null,
  gastosComunes: null,
  contribuciones: null,
  fotos: [],
  titulo: '',
  descripcion: '',
  precio: null,
  moneda: 'UF',
  nombreCorredor: '',
  telefonoCorredor: '',
  whatsappActivo: false,
  whatsappNumero: '',
  emailCorredor: '',
};

export const useNuevaPropiedadStore = create<NuevaPropiedad & NuevaPropiedadActions>()(
  persist(
    (set) => ({
      ...initialState,

      setField: (key, value) => set((state) => ({ ...state, [key]: value })),

      resetForm: () => set({ ...initialState }),

      setFotos: (fotos) => set({ fotos }),

      addFoto: (foto) =>
        set((state) => ({
          fotos: [...state.fotos, foto],
        })),

      removeFoto: (uri) =>
        set((state) => ({
          fotos: state.fotos.filter((f) => f.uri !== uri),
        })),

      reorderFotos: (fotos) => set({ fotos }),

      updateFotoMlId: (uri, mlId) =>
        set((state) => ({
          fotos: state.fotos.map((f) => (f.uri === uri ? { ...f, mlId } : f)),
        })),

      setFotoUploading: (uri, uploading) =>
        set((state) => ({
          fotos: state.fotos.map((f) => (f.uri === uri ? { ...f, uploading } : f)),
        })),

      setFotoUploadError: (uri, uploadError) =>
        set((state) => ({
          fotos: state.fotos.map((f) => (f.uri === uri ? { ...f, uploadError } : f)),
        })),
    }),
    {
      name: 'nueva-propiedad-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
