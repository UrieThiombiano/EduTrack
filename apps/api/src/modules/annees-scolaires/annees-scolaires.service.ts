import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnneeScolaireDto } from './dto/create-annee-scolaire.dto';
import { UpdateAnneeScolaireDto } from './dto/update-annee-scolaire.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class AnneesScolairesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryDto) {
    const where = {
      id_etablissement: etablissementId,
      ...(query.search && { libelle: { contains: query.search, mode: 'insensitive' as const } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.anneeScolaire.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { date_debut: 'desc' },
        include: { _count: { select: { periodes: true, classes: true } } },
      }),
      this.prisma.anneeScolaire.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findCourante(etablissementId: number) {
    const annee = await this.prisma.anneeScolaire.findFirst({
      where: { id_etablissement: etablissementId, est_courante: true },
      include: { periodes: { orderBy: { numero_ordre: 'asc' } } },
    });
    if (!annee) throw new NotFoundException('Aucune année scolaire courante définie');
    return annee;
  }

  async findOne(id: number, etablissementId: number) {
    const annee = await this.prisma.anneeScolaire.findFirst({
      where: { id_annee_scolaire: id, id_etablissement: etablissementId },
      include: {
        periodes: { orderBy: { numero_ordre: 'asc' } },
        _count: { select: { classes: true, attributions: true } },
      },
    });
    if (!annee) throw new NotFoundException(`Année scolaire #${id} introuvable`);
    return annee;
  }

  async create(dto: CreateAnneeScolaireDto, etablissementId: number) {
    const exists = await this.prisma.anneeScolaire.findUnique({
      where: { id_etablissement_libelle: { id_etablissement: etablissementId, libelle: dto.libelle } },
    });
    if (exists) throw new ConflictException(`Année "${dto.libelle}" existe déjà`);

    if (new Date(dto.date_debut) >= new Date(dto.date_fin)) {
      throw new BadRequestException('date_debut doit être antérieure à date_fin');
    }

    return this.prisma.anneeScolaire.create({
      data: { ...dto, id_etablissement: etablissementId, date_debut: new Date(dto.date_debut), date_fin: new Date(dto.date_fin) },
    });
  }

  async update(id: number, dto: UpdateAnneeScolaireDto, etablissementId: number) {
    await this.findOne(id, etablissementId);

    if (dto.est_courante === true) {
      throw new BadRequestException('Utilisez PATCH /annees-scolaires/:id/set-courante pour changer l\'année courante');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.date_debut) data.date_debut = new Date(dto.date_debut);
    if (dto.date_fin) data.date_fin = new Date(dto.date_fin);

    return this.prisma.anneeScolaire.update({ where: { id_annee_scolaire: id }, data });
  }

  async setCourante(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);

    return this.prisma.$transaction([
      this.prisma.anneeScolaire.updateMany({
        where: { id_etablissement: etablissementId, est_courante: true },
        data: { est_courante: false },
      }),
      this.prisma.anneeScolaire.update({
        where: { id_annee_scolaire: id },
        data: { est_courante: true },
      }),
    ]);
  }

  async archiver(id: number, etablissementId: number) {
    const annee = await this.findOne(id, etablissementId);
    if (annee.est_courante) throw new BadRequestException('Impossible d\'archiver l\'année courante');
    return this.prisma.anneeScolaire.update({
      where: { id_annee_scolaire: id },
      data: { est_archivee: true },
    });
  }
}
