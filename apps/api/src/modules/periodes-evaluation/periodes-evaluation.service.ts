import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePeriodeEvaluationDto } from './dto/create-periode-evaluation.dto';

@Injectable()
export class PeriodesEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPeriode(periodeId: number, etablissementId: number) {
    const periode = await this.prisma.periode.findFirst({
      where: { id_periode: periodeId, annee_scolaire: { id_etablissement: etablissementId } },
    });
    if (!periode) throw new NotFoundException(`Période #${periodeId} introuvable`);

    return this.prisma.periodeEvaluation.findMany({
      where: { id_periode: periodeId },
      include: { _count: { select: { evaluations: true } } },
    });
  }

  async findOne(id: number, etablissementId: number) {
    const pe = await this.prisma.periodeEvaluation.findFirst({
      where: {
        id_periode_evaluation: id,
        periode: { annee_scolaire: { id_etablissement: etablissementId } },
      },
      include: { periode: { select: { libelle: true } } },
    });
    if (!pe) throw new NotFoundException(`Période d'évaluation #${id} introuvable`);
    return pe;
  }

  async create(dto: CreatePeriodeEvaluationDto, etablissementId: number) {
    const periode = await this.prisma.periode.findFirst({
      where: { id_periode: dto.id_periode, annee_scolaire: { id_etablissement: etablissementId } },
    });
    if (!periode) throw new NotFoundException(`Période #${dto.id_periode} introuvable`);

    return this.prisma.periodeEvaluation.create({
      data: {
        id_periode: dto.id_periode,
        libelle: dto.libelle,
        date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
        date_fin: dto.date_fin ? new Date(dto.date_fin) : undefined,
      },
    });
  }

  async update(id: number, dto: Partial<CreatePeriodeEvaluationDto>, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.periodeEvaluation.update({
      where: { id_periode_evaluation: id },
      data: {
        libelle: dto.libelle,
        date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
        date_fin: dto.date_fin ? new Date(dto.date_fin) : undefined,
      },
    });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.periodeEvaluation.delete({ where: { id_periode_evaluation: id } });
  }
}
