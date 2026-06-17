import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePeriodeDto } from './dto/create-periode.dto';
import { UpdatePeriodeDto } from './dto/update-periode.dto';

@Injectable()
export class PeriodesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByAnnee(anneeId: number, etablissementId: number) {
    const annee = await this.prisma.anneeScolaire.findFirst({
      where: { id_annee_scolaire: anneeId, id_etablissement: etablissementId },
    });
    if (!annee) throw new NotFoundException(`Année scolaire #${anneeId} introuvable`);

    return this.prisma.periode.findMany({
      where: { id_annee_scolaire: anneeId },
      orderBy: { numero_ordre: 'asc' },
      include: { _count: { select: { bulletins: true, periodes_evaluation: true } } },
    });
  }

  async findOne(id: number, etablissementId: number) {
    const periode = await this.prisma.periode.findFirst({
      where: {
        id_periode: id,
        annee_scolaire: { id_etablissement: etablissementId },
      },
      include: {
        annee_scolaire: { select: { libelle: true } },
        periodes_evaluation: { orderBy: { id_periode_evaluation: 'asc' } },
      },
    });
    if (!periode) throw new NotFoundException(`Période #${id} introuvable`);
    return periode;
  }

  async create(dto: CreatePeriodeDto, etablissementId: number) {
    const annee = await this.prisma.anneeScolaire.findFirst({
      where: { id_annee_scolaire: dto.id_annee_scolaire, id_etablissement: etablissementId },
    });
    if (!annee) throw new NotFoundException(`Année scolaire #${dto.id_annee_scolaire} introuvable`);

    return this.prisma.periode.create({
      data: {
        ...dto,
        date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
        date_fin: dto.date_fin ? new Date(dto.date_fin) : undefined,
      },
    });
  }

  async update(id: number, dto: UpdatePeriodeDto, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.periode.update({
      where: { id_periode: id },
      data: {
        ...dto,
        date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
        date_fin: dto.date_fin ? new Date(dto.date_fin) : undefined,
      },
    });
  }

  async remove(id: number, etablissementId: number) {
    const periode = await this.findOne(id, etablissementId);
    const bulletins = await this.prisma.bulletin.count({ where: { id_periode: id } });
    if (bulletins > 0) throw new NotFoundException(`Impossible de supprimer : ${bulletins} bulletin(s) lié(s)`);
    return this.prisma.periode.delete({ where: { id_periode: periode.id_periode } });
  }
}
