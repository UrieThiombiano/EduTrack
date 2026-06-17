import { apiClient } from './client';
import type { PaginatedResponse, Classe, QueryParams } from '../../types';

const BASE = '/classes';

export const classesService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<Classe> }>(BASE, { params }).then((r) => r.data.data),

  findOne: (id: number) =>
    apiClient.get<{ data: Classe }>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (dto: Record<string, unknown>) =>
    apiClient.post<{ data: Classe }>(BASE, dto).then((r) => r.data.data),

  update: (id: number, dto: Record<string, unknown>) =>
    apiClient.patch<{ data: Classe }>(`${BASE}/${id}`, dto).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete(`${BASE}/${id}`).then((r) => r.data),
};
