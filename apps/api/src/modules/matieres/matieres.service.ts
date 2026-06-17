import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class MatieresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryDto) {
    const where = {
      id_etablissement: etablissementId,
      est_actif: true,
      ...(query.search && {
        OR: [
          { libelle: { contains: query.search, mode: 'insensitive' as const } },
          { code_matiere: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.matiere.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { libelle: 'asc' },
        include: { _count: { select: { coefficients: true, attributions: true } } },
      }),
      this.prisma.matiere.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const matiere = await this.prisma.matiere.findFirst({
      where: { id_matiere: id, id_etablissement: etablissementId },
      include: {
        coefficients: { include: { niveau: { select: { libelle: true } } } },
      },
    });
    if (!matiere) throw new NotFoundException(`Matière #${id} introuvable`);
    return matiere;
  }

  async create(dto: CreateMatiereDto, etablissementId: number) {
    const exists = await this.prisma.matiere.findUnique({ where: { code_matiere: dto.code_matiere } });
    if (exists) throw new ConflictException(`Code matière "${dto.code_matiere}" déjà utilisé`);
    return this.prisma.matiere.create({ data: { ...dto, id_etablissement: etablissementId } });
  }

  async update(id: number, dto: UpdateMatiereDto, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.matiere.update({ where: { id_matiere: id }, data: dto });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.matiere.update({ where: { id_matiere: id }, data: { est_actif: false } });
  }
}
