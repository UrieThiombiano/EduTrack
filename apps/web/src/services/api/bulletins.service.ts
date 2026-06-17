import { apiClient } from './client';
import type { PaginatedResponse, Bulletin, QueryParams } from '../../types';

const BASE = '/bulletins';

export const bulletinsService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<Bulletin> }>(BASE, { params }).then((r) => r.data.data),

  findOne: (id: number) =>
    apiClient.get<{ data: Bulletin }>(`${BASE}/${id}`).then((r) => r.data.data),

  generer: (id_classe: number, id_periode: number) =>
    apiClient.post(`${BASE}/generer`, { id_classe, id_periode }).then((r) => r.data.data),

  publier: (id: number) =>
    apiClient.patch(`${BASE}/${id}/publier`).then((r) => r.data.data),

  publierClasse: (id_classe: number, id_periode: number) =>
    apiClient.patch(`${BASE}/publier-classe`, { id_classe, id_periode }).then((r) => r.data.data),

  downloadPdfUrl: (id: number) =>
    `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'}/bulletins/${id}/pdf`,
};
