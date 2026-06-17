import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEtablissementDto } from './dto/create-etablissement.dto';
import { UpdateEtablissementDto } from './dto/update-etablissement.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class EtablissementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryDto) {
    const where = query.search
      ? { nom: { contains: query.search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.etablissement.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { nom: 'asc' },
        select: {
          id_etablissement: true,
          nom: true,
          code_etablissement: true,
          email: true,
          telephone: true,
          ville: true,
          pays: true,
          type_etablissement: true,
          est_actif: true,
          date_creation: true,
        },
      }),
      this.prisma.etablissement.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number) {
    const etablissement = await this.prisma.etablissement.findUnique({
      where: { id_etablissement: id },
      include: {
        _count: { select: { utilisateurs: true, annees_scolaires: true, niveaux: true } },
      },
    });
    if (!etablissement) throw new NotFoundException(`Établissement #${id} introuvable`);
    return etablissement;
  }

  async create(dto: CreateEtablissementDto) {
    const exists = await this.prisma.etablissement.findUnique({
      where: { code_etablissement: dto.code_etablissement },
    });
    if (exists) throw new ConflictException(`Code "${dto.code_etablissement}" déjà utilisé`);

    return this.prisma.etablissement.create({ data: dto });
  }

  async update(id: number, dto: UpdateEtablissementDto) {
    await this.findOne(id);
    return this.prisma.etablissement.update({
      where: { id_etablissement: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.etablissement.update({
      where: { id_etablissement: id },
      data: { est_actif: false },
    });
  }
}
