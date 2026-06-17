import { apiClient } from './client';
import type { PaginatedResponse, Enseignant, QueryParams } from '../../types';

const BASE = '/enseignants';

export const enseignantsService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<Enseignant> }>(BASE, { params }).then((r) => r.data.data),

  findOne: (id: number) =>
    apiClient.get<{ data: Enseignant }>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (dto: Record<string, unknown>) =>
    apiClient.post<{ data: Enseignant }>(BASE, dto).then((r) => r.data.data),

  update: (id: number, dto: Record<string, unknown>) =>
    apiClient.patch<{ data: Enseignant }>(`${BASE}/${id}`, dto).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete(`${BASE}/${id}`).then((r) => r.data),
};
