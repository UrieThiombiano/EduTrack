import { apiClient } from './client';
import type { PaginatedResponse, Notification, QueryParams } from '../../types';

const BASE = '/notifications';

export const notificationsService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<Notification> & { non_lues: number } }>(BASE, { params }).then((r) => r.data.data),

  countNonLues: () =>
    apiClient.get<{ data: { count: number } }>(`${BASE}/count`).then((r) => r.data.data),

  marquerLu: (id: number) =>
    apiClient.patch(`${BASE}/${id}/lire`).then((r) => r.data),

  marquerToutLu: () =>
    apiClient.patch(`${BASE}/tout-lire`).then((r) => r.data),
};
