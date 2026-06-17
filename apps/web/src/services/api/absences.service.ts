import { apiClient } from './client';
import type { PaginatedResponse, Absence, QueryParams } from '../../types';

const BASE = '/absences';

export const absencesService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<Absence> }>(BASE, { params }).then((r) => r.data.data),

  findOne: (id: number) =>
    apiClient.get<{ data: Absence }>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (dto: Record<string, unknown>) =>
    apiClient.post<{ data: Absence }>(BASE, dto).then((r) => r.data.data),

  justifier: (id: number, motif: string) =>
    apiClient.patch<{ data: Absence }>(`${BASE}/${id}/justifier`, { motif_justification: motif }).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete(`${BASE}/${id}`).then((r) => r.data),
};
