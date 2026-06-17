import { apiClient } from './client';
import type { PaginatedResponse, Sanction, QueryParams } from '../../types';

const BASE = '/sanctions';

export const sanctionsService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<Sanction> }>(BASE, { params }).then((r) => r.data.data),

  findOne: (id: number) =>
    apiClient.get<{ data: Sanction }>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (dto: Record<string, unknown>) =>
    apiClient.post<{ data: Sanction }>(BASE, dto).then((r) => r.data.data),

  update: (id: number, dto: Record<string, unknown>) =>
    apiClient.patch<{ data: Sanction }>(`${BASE}/${id}`, dto).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete(`${BASE}/${id}`).then((r) => r.data),
};
