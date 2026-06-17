import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { QueryAbsenceDto } from './dto/query-absence.dto';
import { JustifierAbsenceDto } from './dto/justifier-absence.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class AbsencesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryAbsenceDto) {
    const where: any = {
      classe: { annee_scolaire: { id_etablissement: etablissementId } },
    };
    if (query.id_eleve) where.id_eleve = query.id_eleve;
    if (query.id_classe) where.id_classe = query.id_classe;
    if (query.type_absence) where.type_absence = query.type_absence;
    if (query.est_justifie !== undefined) where.est_justifie = query.est_justifie === 'true';
    if (query.date_debut || query.date_fin) {
      where.date_absence = {};
      if (query.date_debut) where.date_absence.gte = new Date(query.date_debut);
      if (query.date_fin) where.date_absence.lte = new Date(query.date_fin);
    }

    const [data, total] = await Promise.all([
      this.prisma.absence.findMany({
        where,
        include: {
          eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          classe: { select: { libelle: true, code_classe: true } },
          emploi_du_temps: { include: { attribution: { include: { matiere: { select: { libelle: true } } } } } },
        },
        orderBy: [{ date_absence: 'desc' }, { heure_absence: 'desc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.absence.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const absence = await this.prisma.absence.findFirst({
      where: { id_absence: id, classe: { annee_scolaire: { id_etablissement: etablissementId } } },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        classe: { select: { libelle: true } },
        emploi_du_temps: { include: { attribution: { include: { matiere: true } } } },
      },
    });
    if (!absence) throw new NotFoundException(`Absence #${id} introuvable`);
    return absence;
  }

  async create(dto: CreateAbsenceDto, enseignantUserId: number, etablissementId: number) {
    // Récupérer le profil enseignant
    const enseignant = await this.prisma.enseignant.findFirst({
      where: { id_utilisateur: enseignantUserId, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!enseignant) throw new NotFoundException('Profil enseignant introuvable');

    // Valider élève appartient à l'établissement
    const eleve = await this.prisma.eleve.findFirst({
      where: { id_eleve: dto.id_eleve, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!eleve) throw new NotFoundException(`Élève #${dto.id_eleve} introuvable`);

    // Valider emploi du temps appartient à l'établissement
    const emploi = await this.prisma.emploiDuTemps.findFirst({
      where: { id_emploi: dto.id_emploi_du_temps, attribution: { annee_scolaire: { id_etablissement: etablissementId } } },
    });
    if (!emploi) throw new NotFoundException(`Emploi du temps #${dto.id_emploi_du_temps} introuvable`);

    const absence = await this.prisma.$transaction(async (tx) => {
      const created = await tx.absence.create({
        data: {
          id_eleve: dto.id_eleve,
          id_emploi_du_temps: dto.id_emploi_du_temps,
          id_enseignant: enseignant.id_enseignant,
          id_classe: dto.id_classe,
          type_absence: dto.type_absence,
          date_absence: new Date(dto.date_absence),
          heure_absence: dto.heure_absence ? new Date(`1970-01-01T${dto.heure_absence}`) : null,
          est_justifie: dto.est_justifie ?? false,
          motif_justification: dto.motif_justification ?? null,
        },
        include: {
          eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          classe: { select: { libelle: true } },
        },
      });

      // Notification auto aux parents
      await this.notifierParents(tx, dto.id_eleve, created, etablissementId);

      await tx.absence.update({ where: { id_absence: created.id_absence }, data: { notification_envoyee: true } });

      return created;
    });

    return absence;
  }

  async justifier(id: number, dto: JustifierAbsenceDto, etablissementId: number) {
    const absence = await this.findOne(id, etablissementId);
    if (absence.est_justifie) throw new BadRequestException('Absence déjà justifiée');

    return this.prisma.absence.update({
      where: { id_absence: id },
      data: { est_justifie: true, motif_justification: dto.motif_justification },
    });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.absence.delete({ where: { id_absence: id } });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private async notifierParents(tx: any, eleveId: number, absence: any, etablissementId: number) {
    const liens = await tx.lienParentEleve.findMany({
      where: { id_eleve: eleveId },
      include: { parent: { include: { utilisateur: true } } },
    });

    const typeLabel = absence.type_absence === 'retard' ? 'retard' : 'absence';
    const eleveNom = `${absence.eleve.utilisateur.prenom} ${absence.eleve.utilisateur.nom}`;
    const titre = `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} signalée`;
    const contenu = `Un(e) ${typeLabel} a été signalé(e) pour ${eleveNom} le ${absence.date_absence.toLocaleDateString('fr-FR')} en classe ${absence.classe.libelle}.`;

    for (const lien of liens) {
      if (lien.parent.utilisateur.id_etablissement === etablissementId) {
        await tx.notification.create({
          data: {
            id_destinataire: lien.parent.utilisateur.id_utilisateur,
            type_notification: 'absence',
            canal: 'in_app',
            titre,
            contenu,
            est_envoye: true,
            date_envoi: new Date(),
            metadata: { id_absence: absence.id_absence, type_absence: absence.type_absence },
          },
        });
      }
    }
  }
}
