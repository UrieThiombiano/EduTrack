import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class NiveauxService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryDto) {
    const where = {
      id_etablissement: etablissementId,
      est_actif: true,
      ...(query.search && { libelle: { contains: query.search, mode: 'insensitive' as const } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.niveau.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { ordre_affichage: 'asc' },
        include: {
          coefficients: { include: { matiere: { select: { libelle: true, code_matiere: true } } } },
          _count: { select: { classes: true } },
        },
      }),
      this.prisma.niveau.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const niveau = await this.prisma.niveau.findFirst({
      where: { id_niveau: id, id_etablissement: etablissementId },
      include: {
        coefficients: { include: { matiere: true } },
        _count: { select: { classes: true } },
      },
    });
    if (!niveau) throw new NotFoundException(`Niveau #${id} introuvable`);
    return niveau;
  }

  async create(dto: CreateNiveauDto, etablissementId: number) {
    const exists = await this.prisma.niveau.findFirst({
      where: { id_etablissement: etablissementId, libelle: dto.libelle },
    });
    if (exists) throw new ConflictException(`Niveau "${dto.libelle}" existe déjà`);
    return this.prisma.niveau.create({ data: { ...dto, id_etablissement: etablissementId } });
  }

  async update(id: number, dto: UpdateNiveauDto, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.niveau.update({ where: { id_niveau: id }, data: dto });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.niveau.update({ where: { id_niveau: id }, data: { est_actif: false } });
  }
}
