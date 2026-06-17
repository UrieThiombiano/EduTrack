import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { QueryEvaluationDto } from './dto/query-evaluation.dto';
import { paginate } from '../../common/helpers/pagination.helper';

const EVAL_INCLUDE = {
  attribution: {
    include: {
      matiere: { select: { libelle: true, code_matiere: true } },
      classe: { select: { libelle: true, code_classe: true } },
      enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
    },
  },
  type_evaluation: { select: { libelle: true, ponderation_pourcentage: true } },
  periode_evaluation: { select: { libelle: true } },
  _count: { select: { notes: true } },
} as const;

@Injectable()
export class EvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryEvaluationDto) {
    const where = {
      attribution: { annee_scolaire: { id_etablissement: etablissementId } },
      ...(query.id_attribution && { id_attribution: query.id_attribution }),
      ...(query.id_classe && { attribution: { id_classe: query.id_classe, annee_scolaire: { id_etablissement: etablissementId } } }),
      ...(query.id_periode_evaluation && { id_periode_evaluation: query.id_periode_evaluation }),
      ...(query.statut && { statut: query.statut }),
    };

    const [data, total] = await Promise.all([
      this.prisma.evaluation.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { date_evaluation: 'desc' },
        include: EVAL_INCLUDE,
      }),
      this.prisma.evaluation.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: { id_evaluation: id, attribution: { annee_scolaire: { id_etablissement: etablissementId } } },
      include: {
        ...EVAL_INCLUDE,
        notes: {
          include: {
            eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
          orderBy: { eleve: { utilisateur: { nom: 'asc' } } },
        },
      },
    });
    if (!evaluation) throw new NotFoundException(`Évaluation #${id} introuvable`);
    return evaluation;
  }

  async create(dto: CreateEvaluationDto, etablissementId: number) {
    const attribution = await this.prisma.attributionEnseignant.findFirst({
      where: {
        id_attribution: dto.id_attribution,
        est_actif: true,
        annee_scolaire: { id_etablissement: etablissementId },
      },
    });
    if (!attribution) throw new NotFoundException(`Attribution #${dto.id_attribution} introuvable ou inactive`);

    const periodeEval = await this.prisma.periodeEvaluation.findFirst({
      where: {
        id_periode_evaluation: dto.id_periode_evaluation,
        periode: { annee_scolaire: { id_etablissement: etablissementId } },
      },
    });
    if (!periodeEval) throw new NotFoundException(`Période d'évaluation #${dto.id_periode_evaluation} introuvable`);

    const typeEval = await this.prisma.typeEvaluation.findFirst({
      where: { id_type_evaluation: dto.id_type_evaluation, id_etablissement: etablissementId },
    });
    if (!typeEval) throw new NotFoundException(`Type d'évaluation #${dto.id_type_evaluation} introuvable`);

    return this.prisma.evaluation.create({
      data: {
        id_attribution: dto.id_attribution,
        id_periode_evaluation: dto.id_periode_evaluation,
        id_type_evaluation: dto.id_type_evaluation,
        intitule: dto.intitule,
        note_maximale: dto.note_maximale ?? 20,
        date_evaluation: dto.date_evaluation ? new Date(dto.date_evaluation) : undefined,
        statut: 'brouillon',
      },
      include: EVAL_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateEvaluationDto, etablissementId: number) {
    const evaluation = await this.findOne(id, etablissementId);

    if (evaluation.statut === 'archive') {
      throw new BadRequestException('Une évaluation archivée ne peut pas être modifiée');
    }

    return this.prisma.evaluation.update({
      where: { id_evaluation: id },
      data: {
        ...dto,
        date_evaluation: dto.date_evaluation ? new Date(dto.date_evaluation) : undefined,
      },
      include: EVAL_INCLUDE,
    });
  }

  async valider(id: number, etablissementId: number) {
    const evaluation = await this.findOne(id, etablissementId);
    if (evaluation.statut !== 'brouillon') {
      throw new BadRequestException(`Impossible de valider une évaluation en statut "${evaluation.statut}"`);
    }

    const notesCount = await this.prisma.note.count({ where: { id_evaluation: id } });
    if (notesCount === 0) {
      throw new BadRequestException('Impossible de valider : aucune note saisie');
    }

    return this.prisma.evaluation.update({
      where: { id_evaluation: id },
      data: { statut: 'valide' },
      include: EVAL_INCLUDE,
    });
  }

  async remove(id: number, etablissementId: number) {
    const evaluation = await this.findOne(id, etablissementId);
    if (evaluation.statut !== 'brouillon') {
      throw new BadRequestException('Seules les évaluations en brouillon peuvent être supprimées');
    }
    return this.prisma.evaluation.delete({ where: { id_evaluation: id } });
  }
}
