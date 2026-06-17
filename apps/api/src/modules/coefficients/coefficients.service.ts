import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoefficientDto } from './dto/create-coefficient.dto';

@Injectable()
export class CoefficientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByNiveau(niveauId: number, etablissementId: number) {
    const niveau = await this.prisma.niveau.findFirst({
      where: { id_niveau: niveauId, id_etablissement: etablissementId },
    });
    if (!niveau) throw new NotFoundException(`Niveau #${niveauId} introuvable`);

    return this.prisma.coefficient.findMany({
      where: { id_niveau: niveauId },
      include: { matiere: { select: { libelle: true, code_matiere: true } } },
      orderBy: { matiere: { libelle: 'asc' } },
    });
  }

  async findByMatiere(matiereId: number, etablissementId: number) {
    const matiere = await this.prisma.matiere.findFirst({
      where: { id_matiere: matiereId, id_etablissement: etablissementId },
    });
    if (!matiere) throw new NotFoundException(`Matière #${matiereId} introuvable`);

    return this.prisma.coefficient.findMany({
      where: { id_matiere: matiereId },
      include: { niveau: { select: { libelle: true } } },
    });
  }

  async upsert(dto: CreateCoefficientDto, etablissementId: number) {
    const [matiere, niveau] = await Promise.all([
      this.prisma.matiere.findFirst({ where: { id_matiere: dto.id_matiere, id_etablissement: etablissementId } }),
      this.prisma.niveau.findFirst({ where: { id_niveau: dto.id_niveau, id_etablissement: etablissementId } }),
    ]);
    if (!matiere) throw new NotFoundException(`Matière #${dto.id_matiere} introuvable`);
    if (!niveau) throw new NotFoundException(`Niveau #${dto.id_niveau} introuvable`);

    return this.prisma.coefficient.upsert({
      where: { id_matiere_id_niveau: { id_matiere: dto.id_matiere, id_niveau: dto.id_niveau } },
      create: { id_matiere: dto.id_matiere, id_niveau: dto.id_niveau, valeur: dto.valeur },
      update: { valeur: dto.valeur },
      include: {
        matiere: { select: { libelle: true, code_matiere: true } },
        niveau: { select: { libelle: true } },
      },
    });
  }

  async remove(id: number, etablissementId: number) {
    const coef = await this.prisma.coefficient.findFirst({
      where: {
        id_coefficient: id,
        matiere: { id_etablissement: etablissementId },
      },
    });
    if (!coef) throw new NotFoundException(`Coefficient #${id} introuvable`);

    return this.prisma.coefficient.delete({ where: { id_coefficient: id } });
  }
}
