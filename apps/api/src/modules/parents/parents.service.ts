import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { paginate } from '../../common/helpers/pagination.helper';

const ROLE_PARENT = 'parent';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryDto) {
    const where = {
      est_actif: true,
      utilisateur: {
        id_etablissement: etablissementId,
        ...(query.search && {
          OR: [
            { nom: { contains: query.search, mode: 'insensitive' as const } },
            { prenom: { contains: query.search, mode: 'insensitive' as const } },
            { telephone: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }),
      },
    };
    const [data, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { utilisateur: { nom: 'asc' } },
        include: {
          utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true } },
          _count: { select: { liens_enfants: true } },
        },
      }),
      this.prisma.parent.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const parent = await this.prisma.parent.findFirst({
      where: { id_parent: id, utilisateur: { id_etablissement: etablissementId } },
      include: {
        utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true, est_actif: true } },
        liens_enfants: {
          include: {
            eleve: {
              include: {
                utilisateur: { select: { nom: true, prenom: true } },
                inscriptions: {
                  where: { statut: 'inscrit' },
                  include: { classe: { select: { libelle: true } } },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    if (!parent) throw new NotFoundException(`Parent #${id} introuvable`);
    return parent;
  }

  async create(dto: CreateParentDto, etablissementId: number) {
    const role = await this.prisma.role.findUnique({ where: { libelle: ROLE_PARENT } });
    if (!role) throw new NotFoundException('Rôle parent non configuré');

    if (dto.email) {
      const emailExists = await this.prisma.utilisateur.findFirst({
        where: { email: dto.email, id_etablissement: etablissementId },
      });
      if (emailExists) throw new ConflictException(`Email "${dto.email}" déjà utilisé`);
    }

    const hash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const utilisateur = await tx.utilisateur.create({
        data: {
          id_etablissement: etablissementId,
          id_role: role.id_role,
          nom: dto.nom,
          prenom: dto.prenom,
          email: dto.email,
          telephone: dto.telephone,
          mot_de_passe_hash: hash,
        },
      });
      return tx.parent.create({
        data: {
          id_utilisateur: utilisateur.id_utilisateur,
          profession: dto.profession,
          adresse: dto.adresse,
        },
        include: { utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true } } },
      });
    });
  }

  async update(id: number, dto: UpdateParentDto, etablissementId: number) {
    const parent = await this.findOne(id, etablissementId);
    const { password, nom, prenom, email, telephone, profession, adresse } = dto;

    const userUpdate: Record<string, unknown> = {};
    if (nom) userUpdate.nom = nom;
    if (prenom) userUpdate.prenom = prenom;
    if (email) userUpdate.email = email;
    if (telephone) userUpdate.telephone = telephone;
    if (password) userUpdate.mot_de_passe_hash = await bcrypt.hash(password, 10);

    const parentUpdate: Record<string, unknown> = {};
    if (profession !== undefined) parentUpdate.profession = profession;
    if (adresse !== undefined) parentUpdate.adresse = adresse;

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdate).length > 0) {
        await tx.utilisateur.update({ where: { id_utilisateur: parent.id_utilisateur }, data: userUpdate });
      }
      return tx.parent.update({
        where: { id_parent: id },
        data: parentUpdate,
        include: { utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true } } },
      });
    });
  }

  async remove(id: number, etablissementId: number) {
    const parent = await this.findOne(id, etablissementId);
    return this.prisma.$transaction([
      this.prisma.parent.update({ where: { id_parent: id }, data: { est_actif: false } }),
      this.prisma.utilisateur.update({ where: { id_utilisateur: parent.id_utilisateur }, data: { est_actif: false } }),
    ]);
  }
}
