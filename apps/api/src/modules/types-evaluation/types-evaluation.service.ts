import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTypeEvaluationDto } from './dto/create-type-evaluation.dto';

@Injectable()
export class TypesEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(etablissementId: number) {
    return this.prisma.typeEvaluation.findMany({
      where: { id_etablissement: etablissementId, est_actif: true },
      orderBy: { libelle: 'asc' },
      include: { _count: { select: { evaluations: true } } },
    });
  }

  async findOne(id: number, etablissementId: number) {
    const type = await this.prisma.typeEvaluation.findFirst({
      where: { id_type_evaluation: id, id_etablissement: etablissementId },
    });
    if (!type) throw new NotFoundException(`Type d'évaluation #${id} introuvable`);
    return type;
  }

  async create(dto: CreateTypeEvaluationDto, etablissementId: number) {
    const exists = await this.prisma.typeEvaluation.findFirst({
      where: { id_etablissement: etablissementId, libelle: dto.libelle },
    });
    if (exists) throw new ConflictException(`Type "${dto.libelle}" existe déjà`);

    return this.prisma.typeEvaluation.create({
      data: { ...dto, id_etablissement: etablissementId },
    });
  }

  async update(id: number, dto: Partial<CreateTypeEvaluationDto>, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.typeEvaluation.update({ where: { id_type_evaluation: id }, data: dto });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.typeEvaluation.update({ where: { id_type_evaluation: id }, data: { est_actif: false } });
  }
}
