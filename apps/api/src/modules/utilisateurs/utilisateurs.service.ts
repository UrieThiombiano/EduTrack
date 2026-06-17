import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { QueryUtilisateurDto } from './dto/query-utilisateur.dto';
import { paginate } from '../../common/helpers/pagination.helper';

const SELECT_SAFE = {
  id_utilisateur: true,
  id_etablissement: true,
  id_role: true,
  nom: true,
  prenom: true,
  email: true,
  telephone: true,
  photo_url: true,
  est_actif: true,
  derniere_connexion: true,
  date_creation: true,
  date_modification: true,
  role: { select: { libelle: true } },
} as const;

@Injectable()
export class UtilisateursService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(etablissementId: number, query: QueryUtilisateurDto) {
    const where = {
      id_etablissement: etablissementId,
      ...(query.est_actif !== undefined && { est_actif: query.est_actif === 'true' }),
      ...(query.id_role && { id_role: query.id_role }),
      ...(query.search && {
        OR: [
          { nom: { contains: query.search, mode: 'insensitive' as const } },
          { prenom: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where,
        select: SELECT_SAFE,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      }),
      this.prisma.utilisateur.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: { id_utilisateur: id, id_etablissement: etablissementId },
      select: SELECT_SAFE,
    });
    if (!utilisateur) throw new NotFoundException(`Utilisateur #${id} introuvable`);
    return utilisateur;
  }

  async create(dto: CreateUtilisateurDto, etablissementId: number) {
    if (dto.email) {
      const exists = await this.prisma.utilisateur.findFirst({
        where: { email: dto.email, id_etablissement: etablissementId },
      });
      if (exists) throw new ConflictException(`Email "${dto.email}" déjà utilisé dans cet établissement`);
    }

    const mot_de_passe_hash = await bcrypt.hash(dto.password, 10);
    const { password: _, ...rest } = dto;

    return this.prisma.utilisateur.create({
      data: { ...rest, id_etablissement: etablissementId, mot_de_passe_hash },
      select: SELECT_SAFE,
    });
  }

  async update(id: number, dto: UpdateUtilisateurDto, etablissementId: number) {
    await this.findOne(id, etablissementId);

    const { password, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (password) data.mot_de_passe_hash = await bcrypt.hash(password, 10);

    return this.prisma.utilisateur.update({
      where: { id_utilisateur: id },
      data,
      select: SELECT_SAFE,
    });
  }

  async remove(id: number, etablissementId: number) {
    await this.findOne(id, etablissementId);
    return this.prisma.utilisateur.update({
      where: { id_utilisateur: id },
      data: { est_actif: false },
      select: SELECT_SAFE,
    });
  }
}
