import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import { QuerySanctionDto } from './dto/query-sanction.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class SanctionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QuerySanctionDto) {
    const where: any = {
      classe: { annee_scolaire: { id_etablissement: etablissementId } },
    };
    if (query.id_eleve) where.id_eleve = query.id_eleve;
    if (query.id_classe) where.id_classe = query.id_classe;
    if (query.type_sanction) where.type_sanction = { contains: query.type_sanction, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.sanction.findMany({
        where,
        include: {
          eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          classe: { select: { libelle: true, code_classe: true } },
          auteur: { select: { nom: true, prenom: true } },
        },
        orderBy: { date_sanction: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.sanction.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const sanction = await this.prisma.sanction.findFirst({
      where: { id_sanction: id, classe: { annee_scolaire: { id_etablissement: etablissementId } } },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        classe: { select: { libelle: true } },
        auteur: { select: { nom: true, prenom: true } },
      },
    });
    if (!sanction) throw new NotFoundException(`Sanction #${id} introuvable`);
    return sanction;
  }

  async create(dto: CreateSanctionDto, auteurId: number, etablissementId: number) {
    const eleve = await this.prisma.eleve.findFirst({
      where: { id_eleve: dto.id_eleve, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!eleve) throw new NotFoundException(`Élève #${dto.id_eleve} introuvable`);

    const classe = await this.prisma.classe.findFirst({
      where: { id_classe: dto.id_classe, annee_scolaire: { id_etablissement: etablissementId } },
    });
    if (!classe) throw new NotFoundException(`Classe #${dto.id_classe} introuvable`);

    return this.prisma.sanction.create({
      data: {
        id_eleve: dto.id_eleve,
        id_classe: dto.id_classe,
        id_auteur: auteurId,
        type_sanction: dto.type_sanction,
        motif: dto.motif,
        date_sanction: new Date(dto.date_sanction),
        date_debut_effet: dto.date_debut_effet ? new Date(dto.date_debut_effet) : null,
        date_fin_effet: dto.date_fin_effet ? new Date(dto.date_fin_effet) : null,
        observations: dto.observations ?? null,
      },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        classe: { select: { libelle: true } },
        auteur: { select: { nom: true, prenom: true } },
      },
    });
  }

  async update(id: number, dto: Partial<CreateSanctionDto>, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.sanction.update({
      where: { id_sanction: id },
      data: {
        type_sanction: dto.type_sanction,
        motif: dto.motif,
        date_sanction: dto.date_sanction ? new Date(dto.date_sanction) : undefined,
        date_debut_effet: dto.date_debut_effet ? new Date(dto.date_debut_effet) : undefined,
        date_fin_effet: dto.date_fin_effet ? new Date(dto.date_fin_effet) : undefined,
        observations: dto.observations,
      },
    });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.sanction.delete({ where: { id_sanction: id } });
  }
}
