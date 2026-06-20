import { apiClient } from './client';

const BASE = '/pukri';

export const superAdminService = {
  getStats: () =>
    apiClient.get<{ data: any }>(`${BASE}/stats`).then(r => r.data.data),

  listEtablissements: (page = 1) =>
    apiClient.get<{ data: any }>(`${BASE}/etablissements`, { params: { page, limit: 20 } }).then(r => r.data.data),

  createEtablissement: (dto: Record<string, unknown>) =>
    apiClient.post(`${BASE}/etablissements`, dto).then(r => r.data.data),

  updateEtablissement: (id: number, dto: Record<string, unknown>) =>
    apiClient.patch(`${BASE}/etablissements/${id}`, dto).then(r => r.data.data),

  desactiverEtablissement: (id: number) =>
    apiClient.patch(`${BASE}/etablissements/${id}/desactiver`).then(r => r.data.data),

  deleteEtablissement: (id: number) =>
    apiClient.delete(`${BASE}/etablissements/${id}`),

  getAlerts: () =>
    apiClient.get<{ data: any[] }>(`${BASE}/alertes`).then(r => r.data.data),

  clearAlerts: () =>
    apiClient.delete(`${BASE}/alertes`).then(r => r.data.data),
};
