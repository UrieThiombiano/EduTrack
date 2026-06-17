import { apiClient } from './client';
import type { PaginatedResponse, Eleve, QueryParams } from '../../types';

const BASE = '/eleves';

export const elevesService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<Eleve> }>(BASE, { params }).then((r) => r.data.data),

  findOne: (id: number) =>
    apiClient.get<{ data: Eleve }>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (dto: Record<string, unknown>) =>
    apiClient.post<{ data: Eleve }>(BASE, dto).then((r) => r.data.data),

  update: (id: number, dto: Record<string, unknown>) =>
    apiClient.patch<{ data: Eleve }>(`${BASE}/${id}`, dto).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete(`${BASE}/${id}`).then((r) => r.data),
};
