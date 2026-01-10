/**
 * Unit tests for useAuth hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('starts with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('loads user from token on mount', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      role: 'author',
    };

    localStorage.setItem('access_token', 'fake-token');
    (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles login success', async () => {
    const mockResponse = {
      access_token: 'new-token',
      refresh_token: 'new-refresh',
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      },
    };

    (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useAuth());

    await result.current.login('test@example.com', 'password');

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(localStorage.getItem('access_token')).toBe('new-token');
    expect(result.current.user).toEqual(mockResponse.user);
  });

  it('handles login failure', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await expect(
      result.current.login('test@example.com', 'wrong-password')
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('handles logout', async () => {
    localStorage.setItem('access_token', 'fake-token');
    const { result } = renderHook(() => useAuth());

    result.current.logout();

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('handles token refresh', async () => {
    const mockResponse = {
      access_token: 'refreshed-token',
    };

    localStorage.setItem('refresh_token', 'old-refresh');
    (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useAuth());

    await result.current.refreshToken();

    expect(localStorage.getItem('access_token')).toBe('refreshed-token');
  });
});
