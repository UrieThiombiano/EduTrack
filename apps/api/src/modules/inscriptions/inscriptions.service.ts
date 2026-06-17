import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { UpdateInscriptionDto } from './dto/update-inscription.dto';
import { QueryInscriptionDto } from './dto/query-inscription.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class InscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryInscriptionDto) {
    const where = {
      classe: { annee_scolaire: { id_etablissement: etablissementId } },
      ...(query.id_classe && { id_classe: query.id_classe }),
      ...(query.id_annee_scolaire && { classe: { id_annee_scolaire: query.id_annee_scolaire, annee_scolaire: { id_etablissement: etablissementId } } }),
      ...(query.statut && { statut: query.statut }),
      ...(query.search && {
        eleve: {
          utilisateur: {
            OR: [
              { nom: { contains: query.search, mode: 'insensitive' as const } },
              { prenom: { contains: query.search, mode: 'insensitive' as const } },
            ],
          },
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.inscription.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { date_inscription: 'desc' },
        include: {
          eleve: {
            include: {
              utilisateur: { select: { nom: true, prenom: true, email: true } },
            },
          },
          classe: {
            select: {
              libelle: true,
              code_classe: true,
              niveau: { select: { libelle: true } },
              annee_scolaire: { select: { libelle: true } },
            },
          },
        },
      }),
      this.prisma.inscription.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const inscription = await this.prisma.inscription.findFirst({
      where: {
        id_inscription: id,
        classe: { annee_scolaire: { id_etablissement: etablissementId } },
      },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true, email: true } } } },
        classe: {
          include: {
            niveau: true,
            annee_scolaire: { select: { libelle: true, est_courante: true } },
          },
        },
      },
    });
    if (!inscription) throw new NotFoundException(`Inscription #${id} introuvable`);
    return inscription;
  }

  async create(dto: CreateInscriptionDto, etablissementId: number) {
    const [eleve, classe] = await Promise.all([
      this.prisma.eleve.findFirst({ where: { id_eleve: dto.id_eleve, utilisateur: { id_etablissement: etablissementId } } }),
      this.prisma.classe.findFirst({ where: { id_classe: dto.id_classe, annee_scolaire: { id_etablissement: etablissementId } } }),
    ]);
    if (!eleve) throw new NotFoundException(`Élève #${dto.id_eleve} introuvable`);
    if (!classe) throw new NotFoundException(`Classe #${dto.id_classe} introuvable`);

    const exists = await this.prisma.inscription.findUnique({
      where: { id_eleve_id_classe: { id_eleve: dto.id_eleve, id_classe: dto.id_classe } },
    });
    if (exists) throw new ConflictException('Cet élève est déjà inscrit dans cette classe');

    if (classe.capacite_max) {
      const inscrits = await this.prisma.inscription.count({ where: { id_classe: dto.id_classe, statut: 'inscrit' } });
      if (inscrits >= classe.capacite_max) {
        throw new BadRequestException(`Classe pleine : capacité maximale (${classe.capacite_max}) atteinte`);
      }
    }

    return this.prisma.inscription.create({
      data: {
        id_eleve: dto.id_eleve,
        id_classe: dto.id_classe,
        date_inscription: dto.date_inscription ? new Date(dto.date_inscription) : new Date(),
      },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        classe: { select: { libelle: true, code_classe: true } },
      },
    });
  }

  async update(id: number, dto: UpdateInscriptionDto, etablissementId: number) {
    await this.findOne(id, etablissementId);

    if ((dto.statut === 'sorti' || dto.statut === 'transfere') && !dto.date_sortie) {
      throw new BadRequestException('date_sortie est requise pour les statuts sorti/transfere');
    }

    return this.prisma.inscription.update({
      where: { id_inscription: id },
      data: {
        ...dto,
        date_sortie: dto.date_sortie ? new Date(dto.date_sortie) : undefined,
      },
    });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.inscription.delete({ where: { id_inscription: id } });
  }
}
