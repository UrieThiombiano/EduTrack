import { apiClient } from './client';
import type { LoginResponse, AuthTokens } from '../../types';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/login', { email, password });
    return data.data;
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await apiClient.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken });
    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async () => {
    const { data } = await apiClient.get<{ data: unknown }>('/auth/me');
    return data.data;
  },
};
