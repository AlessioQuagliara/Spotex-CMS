/**
 * Unit tests for API client
 */
import { api, setAuthToken, clearAuthToken } from '@/lib/api';

// Mock fetch
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAuthToken();
  });

  it('makes GET request', async () => {
    const mockResponse = { data: { id: 1, title: 'Test' } };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await api.get('/posts/1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/posts/1'),
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('makes POST request with body', async () => {
    const postData = { title: 'New Post', content: 'Content' };
    const mockResponse = { data: { id: 1, ...postData } };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await api.post('/posts', postData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/posts'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('includes auth token in headers', async () => {
    setAuthToken('test-token');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    await api.get('/protected');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('handles error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Not found' }),
    });

    await expect(api.get('/nonexistent')).rejects.toThrow();
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(api.get('/posts')).rejects.toThrow('Network error');
  });

  it('makes PUT request', async () => {
    const updateData = { title: 'Updated Title' };
    const mockResponse = { data: { id: 1, ...updateData } };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await api.put('/posts/1', updateData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/posts/1'),
      expect.objectContaining({
        method: 'PUT',
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('makes DELETE request', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
    });

    await api.delete('/posts/1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/posts/1'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });
});
