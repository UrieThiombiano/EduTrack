import { apiClient } from './client';

const BASE = '/parent/moi';

export const espaceParentService = {
  mesEnfants: () =>
    apiClient.get<{ data: any[] }>(`${BASE}/enfants`).then(r => r.data.data),

  notes: (eleveId: number) =>
    apiClient.get<{ data: any[] }>(`${BASE}/enfants/${eleveId}/notes`).then(r => r.data.data),

  absences: (eleveId: number) =>
    apiClient.get<{ data: any[] }>(`${BASE}/enfants/${eleveId}/absences`).then(r => r.data.data),

  sanctions: (eleveId: number) =>
    apiClient.get<{ data: any[] }>(`${BASE}/enfants/${eleveId}/sanctions`).then(r => r.data.data),

  bulletins: (eleveId: number) =>
    apiClient.get<{ data: any[] }>(`${BASE}/enfants/${eleveId}/bulletins`).then(r => r.data.data),

  rapportsIA: (eleveId: number) =>
    apiClient.get<{ data: any[] }>(`${BASE}/enfants/${eleveId}/rapports-ia`).then(r => r.data.data),
};
