/**
 * @jest-environment node
 */

import { publishProperty, getUserItems, pauseItem, activateItem, deleteItem } from '../portalInmobiliario';

// Mock fetch globally
(global as any).fetch = jest.fn();

describe('portalInmobiliario service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publishProperty', () => {
    it('should return success with itemId on successful publish', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'item-123', permalink: 'http://ml.com/item-123' }),
      });

      const propertyData = {
        tipoOperacion: 'venta' as const,
        tipoPropiedad: 'casa' as const,
        titulo: 'Casa hermosa',
        precio: 150000000,
        moneda: 'CLP' as const,
        region: 'Metropolitana',
        comuna: 'Santiago',
        direccion: 'Calle Principal 123',
        lat: -33.8688,
        lng: -51.5441,
        dormitorios: 3,
        banos: 2,
        estacionamientos: 1,
        superficieTotal: 200,
        superficieUtil: null,
        bodegas: 0,
        piso: null,
        pisosEdificio: null,
        antiguedad: null,
        amoblado: false,
        mascotas: false,
        orientacion: null,
        gastosComunes: null,
        contribuciones: null,
        fotos: [{ uri: 'file:///test.jpg', mlId: 'ml-id-1' }],
        nombreCorredor: 'Juan Perez',
        telefonoCorredor: '912345678',
        whatsappActivo: true,
        whatsappNumero: '912345678',
        descripcion: 'Descripción test',
        emailCorredor: 'juan@test.com',
      } as any;

      const result = await publishProperty(propertyData, 'test-token');

      expect(result.success).toBe(true);
      expect(result.itemId).toBe('item-123');
      expect(result.permalink).toBe('http://ml.com/item-123');
    });

    it('should return error on failed publish', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid data' }),
      });

      const propertyData = {
        titulo: 'Casa',
        precio: 100000,
        moneda: 'CLP' as const,
        fotos: [],
      } as any;

      const result = await publishProperty(propertyData, 'test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle 401 token expiration', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      });

      const propertyData = { titulo: 'Casa', precio: 100000, moneda: 'CLP' as const, fotos: [] } as any;

      const result = await publishProperty(propertyData, 'invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sesión expirada');
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const propertyData = { titulo: 'Casa', precio: 100000, moneda: 'CLP' as const, fotos: [] } as any;

      const result = await publishProperty(propertyData, 'test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUserItems', () => {
    it('should return empty array on failed first fetch', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      });

      const items = await getUserItems('123456789', 'invalid-token');

      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(0);
    });

    it('should handle empty results', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      const items = await getUserItems('999999999', 'test-token');

      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      });

      const items = await getUserItems('123456789', 'invalid-token');

      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(0);
    });
  });

  describe('pauseItem', () => {
    it('should return true on successful pause', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await pauseItem('item-123', 'test-token');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('item-123'),
        expect.any(Object)
      );
    });

    it('should return false on failed pause', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await pauseItem('invalid-id', 'test-token');

      expect(result).toBe(false);
    });
  });

  describe('activateItem', () => {
    it('should return true on successful activation', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await activateItem('item-123', 'test-token');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('item-123'),
        expect.any(Object)
      );
    });

    it('should return false on failed activation', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await activateItem('invalid-id', 'test-token');

      expect(result).toBe(false);
    });
  });

  describe('deleteItem', () => {
    it('should return true on successful deletion', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await deleteItem('item-123', 'test-token');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('item-123'),
        expect.any(Object)
      );
    });

    it('should return false on failed deletion', async () => {
      const mockFetch = (global as any).fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await deleteItem('nonexistent-id', 'test-token');

      expect(result).toBe(false);
    });
  });
});
