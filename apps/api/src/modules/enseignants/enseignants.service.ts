import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnseignantDto } from './dto/create-enseignant.dto';
import { UpdateEnseignantDto } from './dto/update-enseignant.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { paginate } from '../../common/helpers/pagination.helper';

const ROLE_ENSEIGNANT = 'enseignant';

@Injectable()
export class EnseignantsService {
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
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }),
      },
    };
    const [data, total] = await Promise.all([
      this.prisma.enseignant.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { utilisateur: { nom: 'asc' } },
        include: {
          utilisateur: {
            select: { nom: true, prenom: true, email: true, telephone: true, photo_url: true, est_actif: true },
          },
          _count: { select: { attributions: true } },
        },
      }),
      this.prisma.enseignant.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const enseignant = await this.prisma.enseignant.findFirst({
      where: { id_enseignant: id, utilisateur: { id_etablissement: etablissementId } },
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, email: true, telephone: true, photo_url: true, est_actif: true, role: { select: { libelle: true } } },
        },
        attributions: {
          where: { est_actif: true },
          include: {
            classe: { select: { libelle: true, code_classe: true } },
            matiere: { select: { libelle: true, code_matiere: true } },
            annee_scolaire: { select: { libelle: true, est_courante: true } },
          },
        },
      },
    });
    if (!enseignant) throw new NotFoundException(`Enseignant #${id} introuvable`);
    return enseignant;
  }

  async create(dto: CreateEnseignantDto, etablissementId: number) {
    const role = await this.prisma.role.findUnique({ where: { libelle: ROLE_ENSEIGNANT } });
    if (!role) throw new NotFoundException('Rôle enseignant non configuré');

    const emailExists = await this.prisma.utilisateur.findFirst({
      where: { email: dto.email, id_etablissement: etablissementId },
    });
    if (emailExists) throw new ConflictException(`Email "${dto.email}" déjà utilisé`);

    const matriculeExists = await this.prisma.enseignant.findUnique({ where: { matricule: dto.matricule } });
    if (matriculeExists) throw new ConflictException(`Matricule "${dto.matricule}" déjà utilisé`);

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
      const enseignant = await tx.enseignant.create({
        data: {
          id_utilisateur: utilisateur.id_utilisateur,
          matricule: dto.matricule,
          specialite: dto.specialite,
          grade: dto.grade,
          date_prise_de_fonction: dto.date_prise_de_fonction ? new Date(dto.date_prise_de_fonction) : undefined,
        },
        include: {
          utilisateur: { select: { nom: true, prenom: true, email: true } },
        },
      });
      return enseignant;
    });
  }

  async update(id: number, dto: UpdateEnseignantDto, etablissementId: number) {
    const enseignant = await this.findOne(id, etablissementId);

    const { password, nom, prenom, email, telephone, matricule, specialite, grade, date_prise_de_fonction } = dto;

    const userUpdate: Record<string, unknown> = {};
    if (nom) userUpdate.nom = nom;
    if (prenom) userUpdate.prenom = prenom;
    if (email) userUpdate.email = email;
    if (telephone) userUpdate.telephone = telephone;
    if (password) userUpdate.mot_de_passe_hash = await bcrypt.hash(password, 10);

    const enseignantUpdate: Record<string, unknown> = {};
    if (matricule) enseignantUpdate.matricule = matricule;
    if (specialite !== undefined) enseignantUpdate.specialite = specialite;
    if (grade !== undefined) enseignantUpdate.grade = grade;
    if (date_prise_de_fonction) enseignantUpdate.date_prise_de_fonction = new Date(date_prise_de_fonction);

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdate).length > 0) {
        await tx.utilisateur.update({ where: { id_utilisateur: enseignant.id_utilisateur }, data: userUpdate });
      }
      return tx.enseignant.update({
        where: { id_enseignant: id },
        data: enseignantUpdate,
        include: { utilisateur: { select: { nom: true, prenom: true, email: true } } },
      });
    });
  }

  async remove(id: number, etablissementId: number) {
    const enseignant = await this.findOne(id, etablissementId);
    return this.prisma.$transaction([
      this.prisma.enseignant.update({ where: { id_enseignant: id }, data: { est_actif: false } }),
      this.prisma.utilisateur.update({ where: { id_utilisateur: enseignant.id_utilisateur }, data: { est_actif: false } }),
    ]);
  }
}
