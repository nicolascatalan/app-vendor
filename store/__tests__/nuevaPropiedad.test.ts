import { useNuevaPropiedadStore } from '../nuevaPropiedad';

// Mock AsyncStorage before importing store
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('useNuevaPropiedadStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useNuevaPropiedadStore.setState(useNuevaPropiedadStore.getInitialState?.() || {});
  });

  describe('setField', () => {
    it('should update a single field', () => {
      const store = useNuevaPropiedadStore.getState();
      store.setField('titulo', 'Test Property');
      const updated = useNuevaPropiedadStore.getState();
      expect(updated.titulo).toBe('Test Property');
    });

    it('should update multiple fields independently', () => {
      const store = useNuevaPropiedadStore.getState();
      store.setField('tipoOperacion', 'venta');
      store.setField('precio', 150000000);
      const state = useNuevaPropiedadStore.getState();
      expect(state.tipoOperacion).toBe('venta');
      expect(state.precio).toBe(150000000);
    });

    it('should accept null values', () => {
      const store = useNuevaPropiedadStore.getState();
      store.setField('region', 'Metropolitana');
      store.setField('region', null);
      const state = useNuevaPropiedadStore.getState();
      expect(state.region).toBeNull();
    });
  });

  describe('foto management', () => {
    it('should add a new photo', () => {
      const store = useNuevaPropiedadStore.getState();
      store.addFoto({ uri: 'file:///test.jpg' });
      const state = useNuevaPropiedadStore.getState();
      expect(state.fotos).toHaveLength(1);
      expect(state.fotos[0].uri).toBe('file:///test.jpg');
    });

    it('should remove a photo by uri', () => {
      const store = useNuevaPropiedadStore.getState();
      store.addFoto({ uri: 'file:///test1.jpg' });
      store.addFoto({ uri: 'file:///test2.jpg' });
      store.removeFoto('file:///test1.jpg');
      const state = useNuevaPropiedadStore.getState();
      expect(state.fotos).toHaveLength(1);
      expect(state.fotos[0].uri).toBe('file:///test2.jpg');
    });

    it('should reorder fotos', () => {
      const store = useNuevaPropiedadStore.getState();
      store.addFoto({ uri: 'file:///a.jpg' });
      store.addFoto({ uri: 'file:///b.jpg' });
      store.addFoto({ uri: 'file:///c.jpg' });

      const state = useNuevaPropiedadStore.getState();
      const reordered = [state.fotos[2], state.fotos[0], state.fotos[1]];
      store.reorderFotos(reordered);

      const updated = useNuevaPropiedadStore.getState();
      expect(updated.fotos[0].uri).toBe('file:///c.jpg');
      expect(updated.fotos[1].uri).toBe('file:///a.jpg');
      expect(updated.fotos[2].uri).toBe('file:///b.jpg');
    });

    it('should update foto mlId', () => {
      const store = useNuevaPropiedadStore.getState();
      store.addFoto({ uri: 'file:///test.jpg' });
      store.updateFotoMlId('file:///test.jpg', 'ml-id-123');
      const state = useNuevaPropiedadStore.getState();
      expect(state.fotos[0].mlId).toBe('ml-id-123');
    });

    it('should track foto upload state', () => {
      const store = useNuevaPropiedadStore.getState();
      store.addFoto({ uri: 'file:///test.jpg' });

      store.setFotoUploading('file:///test.jpg', true);
      expect(useNuevaPropiedadStore.getState().fotos[0].uploading).toBe(true);

      store.setFotoUploadProgress('file:///test.jpg', 50);
      expect(useNuevaPropiedadStore.getState().fotos[0].uploadProgress).toBe(50);

      store.setFotoUploadError('file:///test.jpg', true);
      expect(useNuevaPropiedadStore.getState().fotos[0].uploadError).toBe(true);
    });
  });

  describe('resetForm', () => {
    it('should reset all fields to initial state', () => {
      const store = useNuevaPropiedadStore.getState();

      // Fill in some data
      store.setField('titulo', 'Test');
      store.setField('precio', 100000);
      store.setField('dormitorios', 3);
      store.addFoto({ uri: 'file:///test.jpg' });

      // Reset
      store.resetForm();

      // Verify reset
      const state = useNuevaPropiedadStore.getState();
      expect(state.titulo).toBe('');
      expect(state.precio).toBeNull();
      expect(state.dormitorios).toBe(0);
      expect(state.fotos).toHaveLength(0);
      expect(state.tipoOperacion).toBeNull();
      expect(state.moneda).toBe('UF');
    });
  });

  describe('form validation', () => {
    it('should support conditional fields for departamento', () => {
      const store = useNuevaPropiedadStore.getState();
      store.setField('tipoPropiedad', 'departamento');
      store.setField('piso', 5);
      store.setField('pisosEdificio', 20);

      const state = useNuevaPropiedadStore.getState();
      expect(state.piso).toBe(5);
      expect(state.pisosEdificio).toBe(20);
    });

    it('should support conditional fields for arriendo', () => {
      const store = useNuevaPropiedadStore.getState();
      store.setField('tipoOperacion', 'arriendo');
      store.setField('amoblado', true);
      store.setField('mascotas', true);

      const state = useNuevaPropiedadStore.getState();
      expect(state.amoblado).toBe(true);
      expect(state.mascotas).toBe(true);
    });
  });

  describe('currency handling', () => {
    it('should switch between CLP and UF', () => {
      const store = useNuevaPropiedadStore.getState();
      store.setField('moneda', 'CLP');
      expect(useNuevaPropiedadStore.getState().moneda).toBe('CLP');

      store.setField('moneda', 'UF');
      expect(useNuevaPropiedadStore.getState().moneda).toBe('UF');
    });
  });
});

