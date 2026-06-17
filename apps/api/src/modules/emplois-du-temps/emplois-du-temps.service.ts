import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmploiDuTempsDto } from './dto/create-emploi.dto';
import { UpdateEmploiDuTempsDto } from './dto/update-emploi.dto';

const JOURS_LABEL = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

@Injectable()
export class EmploisDuTempsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByClasse(classeId: number, etablissementId: number) {
    const classe = await this.prisma.classe.findFirst({
      where: { id_classe: classeId, annee_scolaire: { id_etablissement: etablissementId } },
    });
    if (!classe) throw new NotFoundException(`Classe #${classeId} introuvable`);

    const emplois = await this.prisma.emploiDuTemps.findMany({
      where: { attribution: { id_classe: classeId }, est_annule: false },
      orderBy: [{ jour_semaine: 'asc' }, { heure_debut: 'asc' }],
      include: {
        attribution: {
          include: {
            matiere: { select: { libelle: true, code_matiere: true } },
            enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
        },
      },
    });

    // Regrouper par jour pour la vue calendrier
    const parJour: Record<number, typeof emplois> = {};
    for (const e of emplois) {
      if (!parJour[e.jour_semaine]) parJour[e.jour_semaine] = [];
      parJour[e.jour_semaine].push(e);
    }
    return parJour;
  }

  async findByEnseignant(enseignantId: number, etablissementId: number) {
    const enseignant = await this.prisma.enseignant.findFirst({
      where: { id_enseignant: enseignantId, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!enseignant) throw new NotFoundException(`Enseignant #${enseignantId} introuvable`);

    return this.prisma.emploiDuTemps.findMany({
      where: { attribution: { id_enseignant: enseignantId }, est_annule: false },
      orderBy: [{ jour_semaine: 'asc' }, { heure_debut: 'asc' }],
      include: {
        attribution: {
          include: {
            matiere: { select: { libelle: true } },
            classe: { select: { libelle: true, code_classe: true } },
          },
        },
      },
    });
  }

  async findOne(id: number, etablissementId: number) {
    const emploi = await this.prisma.emploiDuTemps.findFirst({
      where: {
        id_emploi: id,
        attribution: { annee_scolaire: { id_etablissement: etablissementId } },
      },
      include: {
        attribution: {
          include: {
            matiere: true,
            classe: { select: { libelle: true } },
            enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
        },
      },
    });
    if (!emploi) throw new NotFoundException(`Créneau #${id} introuvable`);
    return emploi;
  }

  async create(dto: CreateEmploiDuTempsDto, etablissementId: number) {
    const attribution = await this.prisma.attributionEnseignant.findFirst({
      where: {
        id_attribution: dto.id_attribution,
        est_actif: true,
        annee_scolaire: { id_etablissement: etablissementId },
      },
    });
    if (!attribution) throw new NotFoundException(`Attribution #${dto.id_attribution} introuvable ou inactive`);

    this.validateHeures(dto.heure_debut, dto.heure_fin);

    await this.detecterConflits(dto, etablissementId);

    return this.prisma.emploiDuTemps.create({
      data: {
        id_attribution: dto.id_attribution,
        jour_semaine: dto.jour_semaine,
        heure_debut: this.parseTime(dto.heure_debut),
        heure_fin: this.parseTime(dto.heure_fin),
        salle: dto.salle,
        date_effective: dto.date_effective ? new Date(dto.date_effective) : null,
      },
      include: {
        attribution: {
          include: {
            matiere: { select: { libelle: true } },
            classe: { select: { libelle: true } },
            enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateEmploiDuTempsDto, etablissementId: number) {
    await this.findOne(id, etablissementId);
    if (dto.heure_debut && dto.heure_fin) this.validateHeures(dto.heure_debut, dto.heure_fin);

    return this.prisma.emploiDuTemps.update({
      where: { id_emploi: id },
      data: {
        ...dto,
        heure_debut: dto.heure_debut ? this.parseTime(dto.heure_debut) : undefined,
        heure_fin: dto.heure_fin ? this.parseTime(dto.heure_fin) : undefined,
        date_effective: dto.date_effective ? new Date(dto.date_effective) : undefined,
      },
    });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.emploiDuTemps.delete({ where: { id_emploi: id } });
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private validateHeures(debut: string, fin: string) {
    const [h1, m1] = debut.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    if (h1 * 60 + m1 >= h2 * 60 + m2) {
      throw new BadRequestException('heure_debut doit être antérieure à heure_fin');
    }
  }

  private parseTime(hhmm: string): Date {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date(1970, 0, 1, h, m, 0);
    return d;
  }

  private async detecterConflits(dto: CreateEmploiDuTempsDto, etablissementId: number) {
    const attribution = await this.prisma.attributionEnseignant.findUnique({
      where: { id_attribution: dto.id_attribution },
    });
    if (!attribution) return;

    // Conflit enseignant : même enseignant, même jour, créneau chevauchant
    const conflitsEnseignant = await this.prisma.emploiDuTemps.findFirst({
      where: {
        est_annule: false,
        jour_semaine: dto.jour_semaine,
        attribution: {
          id_enseignant: attribution.id_enseignant,
          id_annee_scolaire: attribution.id_annee_scolaire,
          id_attribution: { not: dto.id_attribution },
        },
        heure_debut: { lt: this.parseTime(dto.heure_fin) },
        heure_fin: { gt: this.parseTime(dto.heure_debut) },
      },
    });
    if (conflitsEnseignant) {
      throw new BadRequestException(`Conflit : l'enseignant a déjà un cours le ${JOURS_LABEL[dto.jour_semaine]} sur ce créneau`);
    }

    // Conflit salle (si spécifiée)
    if (dto.salle) {
      const conflitSalle = await this.prisma.emploiDuTemps.findFirst({
        where: {
          est_annule: false,
          salle: dto.salle,
          jour_semaine: dto.jour_semaine,
          heure_debut: { lt: this.parseTime(dto.heure_fin) },
          heure_fin: { gt: this.parseTime(dto.heure_debut) },
        },
      });
      if (conflitSalle) {
        throw new BadRequestException(`Conflit : la salle "${dto.salle}" est déjà occupée sur ce créneau`);
      }
    }
  }
}
