// ── Auth ────────────────────────────────────────────────────────
export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  etablissementId: number;
  photoUrl?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ── Pagination ──────────────────────────────────────────────────
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

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

// ── API Error ───────────────────────────────────────────────────
export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
}

// ── Entités métier ──────────────────────────────────────────────
export interface Utilisateur {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  est_actif: boolean;
}

export interface Eleve {
  id_eleve: number;
  id_utilisateur: number;
  matricule: string;
  date_naissance: string | null;
  sexe: string | null;
  est_actif: boolean;
  utilisateur: { nom: string; prenom: string; email?: string | null };
}

export interface Enseignant {
  id_enseignant: number;
  id_utilisateur: number;
  matricule: string;
  specialite: string | null;
  grade: string | null;
  est_actif: boolean;
  utilisateur: { nom: string; prenom: string; email?: string | null };
}

export interface Classe {
  id_classe: number;
  code_classe: string;
  libelle: string;
  est_actif: boolean;
  niveau: { libelle: string };
  annee_scolaire: { libelle: string };
  _count?: { inscriptions: number };
}

export interface Matiere {
  id_matiere: number;
  code_matiere: string;
  libelle: string;
  est_actif: boolean;
}

export interface AnneeScolaire {
  id_annee_scolaire: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  est_courante: boolean;
}

export interface Periode {
  id_periode: number;
  id_annee_scolaire: number;
  type_periode: string;
  libelle: string | null;
  numero_ordre: number;
}

export interface Evaluation {
  id_evaluation: number;
  intitule: string | null;
  note_maximale: number;
  date_evaluation: string | null;
  statut: string;
  attribution: {
    matiere: { libelle: string };
    classe: { libelle: string };
  };
  type_evaluation: { libelle: string };
  periode_evaluation: { libelle: string | null };
}

export interface Note {
  id_note: number;
  valeur_note: number | null;
  est_absent: boolean;
  commentaire: string | null;
  eleve: { utilisateur: { nom: string; prenom: string } };
}

export interface Absence {
  id_absence: number;
  type_absence: 'absence' | 'retard';
  date_absence: string;
  est_justifie: boolean;
  motif_justification: string | null;
  eleve: { utilisateur: { nom: string; prenom: string } };
  classe: { libelle: string };
  emploi_du_temps: { attribution: { matiere: { libelle: string } } };
}

export interface Sanction {
  id_sanction: number;
  type_sanction: string;
  motif: string;
  date_sanction: string;
  date_debut_effet: string | null;
  date_fin_effet: string | null;
  observations: string | null;
  eleve: { utilisateur: { nom: string; prenom: string } };
  classe: { libelle: string };
  auteur: { nom: string; prenom: string };
}

export interface Notification {
  id_notification: number;
  type_notification: string;
  canal: string;
  titre: string | null;
  contenu: string;
  est_lu: boolean;
  date_creation: string;
  date_lecture: string | null;
}

export interface LigneBulletin {
  id_ligne_bulletin: number;
  moyenne_matiere: number | null;
  coefficient: number | null;
  points_ponderes: number | null;
  rang_matiere: number | null;
  note_min_classe: number | null;
  note_max_classe: number | null;
  appreciation_enseignant: string | null;
  matiere: { libelle: string; code_matiere: string };
  enseignant: { utilisateur: { nom: string; prenom: string } };
}

export interface Bulletin {
  id_bulletin: number;
  moyenne_generale: number | null;
  rang: number | null;
  total_eleves_classe: number | null;
  total_absences: number;
  total_retards: number;
  appreciation_generale: string | null;
  decision_conseil: string | null;
  est_publie: boolean;
  date_generation: string | null;
  eleve: { utilisateur: { nom: string; prenom: string } };
  periode: { libelle: string | null; type_periode: string };
  classe: { libelle: string };
  lignes?: LigneBulletin[];
}

export interface RapportIA {
  id_rapport_ia: number;
  forces: string[];
  faiblesses: string[];
  recommandations: string[];
  evolution_recente: { tendance: string; commentaire: string } | null;
  score_risque: number | null;
  niveau_risque: 'faible' | 'moyen' | 'eleve' | 'critique' | null;
  version_modele: string | null;
  date_generation: string;
  eleve: { utilisateur: { nom: string; prenom: string } };
  periode: { libelle: string | null };
}
