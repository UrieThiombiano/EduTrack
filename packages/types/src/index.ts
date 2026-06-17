export type Role = 'administration' | 'directeur' | 'enseignant' | 'parent' | 'eleve';
export type TypeAbsence = 'absence' | 'retard';
export type StatutInscription = 'inscrit' | 'transfere' | 'sorti' | 'abandonne';
export type StatutEvaluation = 'brouillon' | 'valide' | 'archive';
export type NiveauRisque = 'faible' | 'moyen' | 'eleve' | 'critique';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
  etablissementId: number;
  iat?: number;
  exp?: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiSuccessResponse<T> {
  data: T;
}
