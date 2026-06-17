import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttributionDto } from './dto/create-attribution.dto';
import { QueryAttributionDto } from './dto/query-attribution.dto';
import { paginate } from '../../common/helpers/pagination.helper';

const ATTRIBUTION_INCLUDE = {
  enseignant: {
    include: { utilisateur: { select: { nom: true, prenom: true, email: true } } },
  },
  classe: {
    select: {
      libelle: true,
      code_classe: true,
      niveau: { select: { libelle: true } },
    },
  },
  matiere: { select: { libelle: true, code_matiere: true } },
  annee_scolaire: { select: { libelle: true, est_courante: true } },
  _count: { select: { evaluations: true, emplois_du_temps: true } },
} as const;

@Injectable()
export class AttributionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryAttributionDto) {
    const where = {
      est_actif: true,
      annee_scolaire: { id_etablissement: etablissementId },
      ...(query.id_enseignant && { id_enseignant: query.id_enseignant }),
      ...(query.id_classe && { id_classe: query.id_classe }),
      ...(query.id_matiere && { id_matiere: query.id_matiere }),
      ...(query.id_annee_scolaire && { id_annee_scolaire: query.id_annee_scolaire }),
    };
    const [data, total] = await Promise.all([
      this.prisma.attributionEnseignant.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ classe: { libelle: 'asc' } }, { matiere: { libelle: 'asc' } }],
        include: ATTRIBUTION_INCLUDE,
      }),
      this.prisma.attributionEnseignant.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const attribution = await this.prisma.attributionEnseignant.findFirst({
      where: { id_attribution: id, annee_scolaire: { id_etablissement: etablissementId } },
      include: {
        ...ATTRIBUTION_INCLUDE,
        emplois_du_temps: { orderBy: [{ jour_semaine: 'asc' }, { heure_debut: 'asc' }] },
        evaluations: {
          orderBy: { date_evaluation: 'desc' },
          include: {
            type_evaluation: { select: { libelle: true } },
            _count: { select: { notes: true } },
          },
        },
      },
    });
    if (!attribution) throw new NotFoundException(`Attribution #${id} introuvable`);
    return attribution;
  }

  async create(dto: CreateAttributionDto, etablissementId: number) {
    const [enseignant, classe, matiere, annee] = await Promise.all([
      this.prisma.enseignant.findFirst({ where: { id_enseignant: dto.id_enseignant, utilisateur: { id_etablissement: etablissementId } } }),
      this.prisma.classe.findFirst({ where: { id_classe: dto.id_classe, annee_scolaire: { id_etablissement: etablissementId } } }),
      this.prisma.matiere.findFirst({ where: { id_matiere: dto.id_matiere, id_etablissement: etablissementId } }),
      this.prisma.anneeScolaire.findFirst({ where: { id_annee_scolaire: dto.id_annee_scolaire, id_etablissement: etablissementId } }),
    ]);

    if (!enseignant) throw new NotFoundException(`Enseignant #${dto.id_enseignant} introuvable`);
    if (!classe) throw new NotFoundException(`Classe #${dto.id_classe} introuvable`);
    if (!matiere) throw new NotFoundException(`Matière #${dto.id_matiere} introuvable`);
    if (!annee) throw new NotFoundException(`Année scolaire #${dto.id_annee_scolaire} introuvable`);

    if (classe.id_annee_scolaire !== dto.id_annee_scolaire) {
      throw new BadRequestException('La classe n\'appartient pas à cette année scolaire');
    }

    const exists = await this.prisma.attributionEnseignant.findUnique({
      where: {
        id_enseignant_id_classe_id_matiere_id_annee_scolaire: {
          id_enseignant: dto.id_enseignant,
          id_classe: dto.id_classe,
          id_matiere: dto.id_matiere,
          id_annee_scolaire: dto.id_annee_scolaire,
        },
      },
    });
    if (exists) throw new ConflictException('Cette attribution existe déjà');

    return this.prisma.attributionEnseignant.create({
      data: dto,
      include: ATTRIBUTION_INCLUDE,
    });
  }

  async toggleActif(id: number, etablissementId: number) {
    const attribution = await this.findOne(id, etablissementId);
    return this.prisma.attributionEnseignant.update({
      where: { id_attribution: id },
      data: { est_actif: !attribution.est_actif },
      include: ATTRIBUTION_INCLUDE,
    });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    const evaluations = await this.prisma.evaluation.count({ where: { id_attribution: id } });
    if (evaluations > 0) {
      throw new BadRequestException(`Impossible : ${evaluations} évaluation(s) liée(s) — désactivez plutôt`);
    }
    return this.prisma.attributionEnseignant.delete({ where: { id_attribution: id } });
  }
}
