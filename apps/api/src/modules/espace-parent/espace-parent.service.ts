import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EspaceParentService {
  constructor(private readonly prisma: PrismaService) {}

  private async getParentProfil(userId: number, etablissementId: number) {
    const parent = await this.prisma.parent.findFirst({
      where: { utilisateur: { id_utilisateur: userId, id_etablissement: etablissementId } },
      include: { liens_enfants: { include: { eleve: { include: { utilisateur: { select: { nom: true, prenom: true, photo_url: true } } } } } } },
    });
    if (!parent) throw new NotFoundException('Profil parent introuvable');
    return parent;
  }

  private async verifierEnfant(parentUserId: number, eleveId: number, etablissementId: number) {
    const parent = await this.getParentProfil(parentUserId, etablissementId);
    const lien = parent.liens_enfants.find(l => l.id_eleve === eleveId);
    if (!lien) throw new ForbiddenException('Cet élève ne fait pas partie de vos enfants');
    return lien.eleve;
  }

  // ── Mes enfants ──────────────────────────────────────────────────────────
  async mesEnfants(userId: number, etablissementId: number) {
    const parent = await this.getParentProfil(userId, etablissementId);

    const enfants = await Promise.all(
      parent.liens_enfants.map(async (lien) => {
        const derniereClasse = await this.prisma.inscription.findFirst({
          where: { id_eleve: lien.id_eleve, statut: 'inscrit' },
          include: {
            classe: {
              include: {
                annee_scolaire: { select: { libelle: true, est_courante: true } },
                niveau: { select: { libelle: true } },
              },
            },
          },
          orderBy: { date_inscription: 'desc' },
        });

        const [totalAbsences, totalRetards, dernierbulletin] = await Promise.all([
          this.prisma.absence.count({ where: { id_eleve: lien.id_eleve, type_absence: 'absence' } }),
          this.prisma.absence.count({ where: { id_eleve: lien.id_eleve, type_absence: 'retard' } }),
          this.prisma.bulletin.findFirst({
            where: { id_eleve: lien.id_eleve, est_publie: true },
            orderBy: { date_generation: 'desc' },
            select: { moyenne_generale: true, rang: true, total_eleves_classe: true, periode: { select: { libelle: true } } },
          }),
        ]);

        return {
          ...lien.eleve,
          type_lien: lien.type_lien,
          est_contact_principal: lien.est_contact_principal,
          classe_actuelle: derniereClasse?.classe ?? null,
          stats: { totalAbsences, totalRetards },
          dernier_bulletin: dernierbulletin,
        };
      }),
    );

    return enfants;
  }

  // ── Notes de mon enfant ──────────────────────────────────────────────────
  async notesEnfant(parentUserId: number, eleveId: number, etablissementId: number) {
    await this.verifierEnfant(parentUserId, eleveId, etablissementId);

    return this.prisma.note.findMany({
      where: { id_eleve: eleveId },
      include: {
        evaluation: {
          include: {
            attribution: { include: { matiere: { select: { libelle: true } }, classe: { select: { libelle: true } } } },
            type_evaluation: { select: { libelle: true } },
            periode_evaluation: { include: { periode: { select: { libelle: true } } } },
          },
        },
      },
      orderBy: { evaluation: { date_evaluation: 'desc' } },
    });
  }

  // ── Absences de mon enfant ───────────────────────────────────────────────
  async absencesEnfant(parentUserId: number, eleveId: number, etablissementId: number) {
    await this.verifierEnfant(parentUserId, eleveId, etablissementId);

    return this.prisma.absence.findMany({
      where: { id_eleve: eleveId },
      include: {
        classe: { select: { libelle: true } },
        emploi_du_temps: { include: { attribution: { include: { matiere: { select: { libelle: true } } } } } },
      },
      orderBy: { date_absence: 'desc' },
    });
  }

  // ── Sanctions de mon enfant ──────────────────────────────────────────────
  async sanctionsEnfant(parentUserId: number, eleveId: number, etablissementId: number) {
    await this.verifierEnfant(parentUserId, eleveId, etablissementId);

    return this.prisma.sanction.findMany({
      where: { id_eleve: eleveId },
      include: { classe: { select: { libelle: true } }, auteur: { select: { nom: true, prenom: true } } },
      orderBy: { date_sanction: 'desc' },
    });
  }

  // ── Bulletins de mon enfant ──────────────────────────────────────────────
  async bulletinsEnfant(parentUserId: number, eleveId: number, etablissementId: number) {
    await this.verifierEnfant(parentUserId, eleveId, etablissementId);

    return this.prisma.bulletin.findMany({
      where: { id_eleve: eleveId, est_publie: true },
      include: {
        periode: { select: { libelle: true, type_periode: true } },
        classe: { select: { libelle: true } },
        lignes: {
          include: { matiere: { select: { libelle: true } } },
          orderBy: { matiere: { libelle: 'asc' } },
        },
      },
      orderBy: { date_generation: 'desc' },
    });
  }

  // ── Rapport IA de mon enfant (lecture seule) ─────────────────────────────
  async rapportsEnfant(parentUserId: number, eleveId: number, etablissementId: number) {
    await this.verifierEnfant(parentUserId, eleveId, etablissementId);

    return this.prisma.rapportIA.findMany({
      where: { id_eleve: eleveId },
      include: { periode: { select: { libelle: true } } },
      orderBy: { date_generation: 'desc' },
    });
  }
}
