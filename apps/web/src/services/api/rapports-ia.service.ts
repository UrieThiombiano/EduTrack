import { apiClient } from './client';
import type { PaginatedResponse, RapportIA, QueryParams } from '../../types';

const BASE = '/rapports-ia';

export const rapportsIaService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<RapportIA> }>(BASE, { params }).then((r) => r.data.data),

  findByEleve: (eleveId: number) =>
    apiClient.get<{ data: RapportIA[] }>(`${BASE}/eleve/${eleveId}`).then((r) => r.data.data),

  findOne: (id: number) =>
    apiClient.get<{ data: RapportIA }>(`${BASE}/${id}`).then((r) => r.data.data),

  generer: (id_eleve: number, id_periode: number) =>
    apiClient.post(`${BASE}/generer`, { id_eleve, id_periode }).then((r) => r.data.data),
};
