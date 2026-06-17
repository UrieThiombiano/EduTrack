import { apiClient } from './client';
import type { PaginatedResponse, Evaluation, Note, QueryParams } from '../../types';

export const evaluationsService = {
  findAll: (params?: QueryParams) =>
    apiClient.get<{ data: PaginatedResponse<Evaluation> }>('/evaluations', { params }).then((r) => r.data.data),

  findOne: (id: number) =>
    apiClient.get<{ data: Evaluation }>(`/evaluations/${id}`).then((r) => r.data.data),

  create: (dto: Record<string, unknown>) =>
    apiClient.post<{ data: Evaluation }>('/evaluations', dto).then((r) => r.data.data),

  update: (id: number, dto: Record<string, unknown>) =>
    apiClient.patch<{ data: Evaluation }>(`/evaluations/${id}`, dto).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete(`/evaluations/${id}`).then((r) => r.data),

  // Notes
  getNotes: (evaluationId: number) =>
    apiClient.get<{ data: { evaluation: Evaluation; notes: Note[]; stats: unknown } }>(`/notes/evaluation/${evaluationId}`).then((r) => r.data.data),

  saisieBulk: (evaluationId: number, notes: Array<{ id_eleve: number; valeur_note?: number | null; est_absent?: boolean }>) =>
    apiClient.post(`/notes/evaluation/${evaluationId}/bulk`, { notes }).then((r) => r.data.data),
};
