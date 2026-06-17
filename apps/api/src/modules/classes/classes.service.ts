import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClasseDto } from './dto/create-classe.dto';
import { UpdateClasseDto } from './dto/update-classe.dto';
import { QueryClasseDto } from './dto/query-classe.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryClasseDto) {
    const where = {
      est_actif: true,
      annee_scolaire: { id_etablissement: etablissementId },
      ...(query.id_annee_scolaire && { id_annee_scolaire: query.id_annee_scolaire }),
      ...(query.id_niveau && { id_niveau: query.id_niveau }),
      ...(query.search && {
        OR: [
          { libelle: { contains: query.search, mode: 'insensitive' as const } },
          { code_classe: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.classe.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ niveau: { ordre_affichage: 'asc' } }, { libelle: 'asc' }],
        include: {
          niveau: { select: { libelle: true } },
          annee_scolaire: { select: { libelle: true } },
          enseignant_titulaire: {
            include: { utilisateur: { select: { nom: true, prenom: true } } },
          },
          _count: { select: { inscriptions: true, attributions: true } },
        },
      }),
      this.prisma.classe.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const classe = await this.prisma.classe.findFirst({
      where: { id_classe: id, annee_scolaire: { id_etablissement: etablissementId } },
      include: {
        niveau: true,
        annee_scolaire: { select: { libelle: true, est_courante: true } },
        enseignant_titulaire: {
          include: { utilisateur: { select: { nom: true, prenom: true, email: true } } },
        },
        attributions: {
          include: {
            matiere: { select: { libelle: true, code_matiere: true } },
            enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
        },
        _count: { select: { inscriptions: true } },
      },
    });
    if (!classe) throw new NotFoundException(`Classe #${id} introuvable`);
    return classe;
  }

  async create(dto: CreateClasseDto, etablissementId: number) {
    const annee = await this.prisma.anneeScolaire.findFirst({
      where: { id_annee_scolaire: dto.id_annee_scolaire, id_etablissement: etablissementId },
    });
    if (!annee) throw new NotFoundException(`Année scolaire #${dto.id_annee_scolaire} introuvable`);

    const niveau = await this.prisma.niveau.findFirst({
      where: { id_niveau: dto.id_niveau, id_etablissement: etablissementId },
    });
    if (!niveau) throw new NotFoundException(`Niveau #${dto.id_niveau} introuvable`);

    return this.prisma.classe.create({
      data: dto,
      include: { niveau: { select: { libelle: true } } },
    });
  }

  async update(id: number, dto: UpdateClasseDto, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.classe.update({
      where: { id_classe: id },
      data: dto,
      include: { niveau: { select: { libelle: true } } },
    });
  }

  async remove(id: number, etablissementId: number) {
    const classe = await this.findOne(id, etablissementId);
    const inscrits = await this.prisma.inscription.count({ where: { id_classe: id } });
    if (inscrits > 0) throw new BadRequestException(`Impossible : ${inscrits} élève(s) inscrit(s) dans cette classe`);
    return this.prisma.classe.update({ where: { id_classe: id }, data: { est_actif: false } });
  }
}
