import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEleveDto } from './dto/create-eleve.dto';
import { UpdateEleveDto } from './dto/update-eleve.dto';
import { QueryEleveDto } from './dto/query-eleve.dto';
import { paginate } from '../../common/helpers/pagination.helper';

const ROLE_ELEVE = 'eleve';

@Injectable()
export class ElevesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryEleveDto) {
    const inscriptionFilter = query.id_classe || query.id_annee_scolaire
      ? {
          inscriptions: {
            some: {
              ...(query.id_classe && { id_classe: query.id_classe }),
              ...(query.id_annee_scolaire && { classe: { id_annee_scolaire: query.id_annee_scolaire } }),
            },
          },
        }
      : {};

    const where = {
      est_actif: true,
      utilisateur: { id_etablissement: etablissementId },
      ...(query.sexe && { sexe: query.sexe }),
      ...inscriptionFilter,
      ...(query.search && {
        utilisateur: {
          id_etablissement: etablissementId,
          OR: [
            { nom: { contains: query.search, mode: 'insensitive' as const } },
            { prenom: { contains: query.search, mode: 'insensitive' as const } },
          ],
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.eleve.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { utilisateur: { nom: 'asc' } },
        include: {
          utilisateur: {
            select: { nom: true, prenom: true, email: true, telephone: true, photo_url: true },
          },
          inscriptions: {
            where: { statut: 'inscrit' },
            include: { classe: { select: { libelle: true, code_classe: true } } },
            take: 1,
            orderBy: { date_inscription: 'desc' },
          },
        },
      }),
      this.prisma.eleve.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const eleve = await this.prisma.eleve.findFirst({
      where: { id_eleve: id, utilisateur: { id_etablissement: etablissementId } },
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, email: true, telephone: true, photo_url: true, est_actif: true, role: { select: { libelle: true } } },
        },
        inscriptions: {
          include: {
            classe: {
              select: { libelle: true, code_classe: true, niveau: { select: { libelle: true } }, annee_scolaire: { select: { libelle: true } } },
            },
          },
          orderBy: { date_inscription: 'desc' },
        },
        liens_parents: {
          include: { parent: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } } },
        },
        _count: { select: { notes: true, absences: true } },
      },
    });
    if (!eleve) throw new NotFoundException(`Élève #${id} introuvable`);
    return eleve;
  }

  async create(dto: CreateEleveDto, etablissementId: number) {
    const role = await this.prisma.role.findUnique({ where: { libelle: ROLE_ELEVE } });
    if (!role) throw new NotFoundException('Rôle élève non configuré');

    const matriculeExists = await this.prisma.eleve.findUnique({ where: { matricule: dto.matricule } });
    if (matriculeExists) throw new ConflictException(`Matricule "${dto.matricule}" déjà utilisé`);

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
      return tx.eleve.create({
        data: {
          id_utilisateur: utilisateur.id_utilisateur,
          matricule: dto.matricule,
          date_naissance: dto.date_naissance ? new Date(dto.date_naissance) : undefined,
          lieu_naissance: dto.lieu_naissance,
          sexe: dto.sexe,
          numero_extrait_naissance: dto.numero_extrait_naissance,
        },
        include: { utilisateur: { select: { nom: true, prenom: true, email: true } } },
      });
    });
  }

  async update(id: number, dto: UpdateEleveDto, etablissementId: number) {
    const eleve = await this.findOne(id, etablissementId);

    const { password, nom, prenom, email, telephone, matricule, date_naissance, lieu_naissance, sexe, numero_extrait_naissance } = dto;

    const userUpdate: Record<string, unknown> = {};
    if (nom) userUpdate.nom = nom;
    if (prenom) userUpdate.prenom = prenom;
    if (email) userUpdate.email = email;
    if (telephone) userUpdate.telephone = telephone;
    if (password) userUpdate.mot_de_passe_hash = await bcrypt.hash(password, 10);

    const eleveUpdate: Record<string, unknown> = {};
    if (matricule) eleveUpdate.matricule = matricule;
    if (date_naissance) eleveUpdate.date_naissance = new Date(date_naissance);
    if (lieu_naissance !== undefined) eleveUpdate.lieu_naissance = lieu_naissance;
    if (sexe) eleveUpdate.sexe = sexe;
    if (numero_extrait_naissance !== undefined) eleveUpdate.numero_extrait_naissance = numero_extrait_naissance;

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdate).length > 0) {
        await tx.utilisateur.update({ where: { id_utilisateur: eleve.id_utilisateur }, data: userUpdate });
      }
      return tx.eleve.update({
        where: { id_eleve: id },
        data: eleveUpdate,
        include: { utilisateur: { select: { nom: true, prenom: true, email: true } } },
      });
    });
  }

  async remove(id: number, etablissementId: number) {
    const eleve = await this.findOne(id, etablissementId);
    return this.prisma.$transaction([
      this.prisma.eleve.update({ where: { id_eleve: id }, data: { est_actif: false } }),
      this.prisma.utilisateur.update({ where: { id_utilisateur: eleve.id_utilisateur }, data: { est_actif: false } }),
    ]);
  }
}
