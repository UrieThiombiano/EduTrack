import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

const ALERT_KEY = 'pukri:request_errors';
const MAX_ALERTS = 200;

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Stats plateforme ──────────────────────────────────────────────────────
  async getStats() {
    const [
      totalEtablissements,
      totalUtilisateurs,
      totalEleves,
      totalEnseignants,
      totalParents,
      totalAbsences,
      totalBulletins,
    ] = await Promise.all([
      this.prisma.etablissement.count({ where: { est_actif: true, NOT: { code_etablissement: 'PUKRI-HQ' } } }),
      this.prisma.utilisateur.count({ where: { est_actif: true, NOT: { etablissement: { code_etablissement: 'PUKRI-HQ' } } } }),
      this.prisma.eleve.count({ where: { est_actif: true } }),
      this.prisma.enseignant.count({ where: { est_actif: true } }),
      this.prisma.parent.count({ where: { est_actif: true } }),
      this.prisma.absence.count(),
      this.prisma.bulletin.count({ where: { est_publie: true } }),
    ]);

    const alertes = await this.getAlerts();

    return {
      plateforme: {
        totalEtablissements,
        totalUtilisateurs,
        totalEleves,
        totalEnseignants,
        totalParents,
        totalAbsences,
        bulletinsPublies: totalBulletins,
      },
      alertes_recentes: alertes.slice(0, 5),
    };
  }

  // ── Établissements ─────────────────────────────────────────────────────────
  async listEtablissements(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { NOT: { code_etablissement: 'PUKRI-HQ' } };

    const [data, total] = await Promise.all([
      this.prisma.etablissement.findMany({
        where,
        include: {
          _count: {
            select: {
              utilisateurs: { where: { est_actif: true } },
              annees_scolaires: true,
            },
          },
        },
        orderBy: { date_creation: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.etablissement.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getEtablissement(id: number) {
    const etab = await this.prisma.etablissement.findFirst({
      where: { id_etablissement: id, NOT: { code_etablissement: 'PUKRI-HQ' } },
      include: {
        _count: { select: { utilisateurs: true, annees_scolaires: true } },
        annees_scolaires: {
          orderBy: { date_debut: 'desc' },
          take: 3,
          select: { libelle: true, est_courante: true, date_debut: true, date_fin: true },
        },
      },
    });
    if (!etab) throw new NotFoundException(`Établissement #${id} introuvable`);
    return etab;
  }

  async createEtablissement(dto: {
    nom: string;
    code_etablissement: string;
    email?: string;
    telephone?: string;
    ville?: string;
    pays?: string;
    type_etablissement?: string;
    adresse?: string;
  }) {
    const exists = await this.prisma.etablissement.findUnique({ where: { code_etablissement: dto.code_etablissement } });
    if (exists) throw new BadRequestException(`Code établissement "${dto.code_etablissement}" déjà utilisé`);
    return this.prisma.etablissement.create({ data: { pays: 'Burkina Faso', ...dto } });
  }

  async updateEtablissement(id: number, dto: Partial<{ nom: string; telephone: string; email: string; adresse: string; est_actif: boolean }>) {
    await this.getEtablissement(id);
    return this.prisma.etablissement.update({ where: { id_etablissement: id }, data: dto });
  }

  async deleteEtablissement(id: number) {
    const etab = await this.getEtablissement(id);

    const usersCount = await this.prisma.utilisateur.count({ where: { id_etablissement: id } });
    if (usersCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${usersCount} utilisateur(s) rattaché(s). Désactivez d'abord l'établissement.`,
      );
    }

    return this.prisma.etablissement.delete({ where: { id_etablissement: id } });
  }

  async desactiverEtablissement(id: number) {
    await this.getEtablissement(id);
    return this.prisma.etablissement.update({ where: { id_etablissement: id }, data: { est_actif: false } });
  }

  // ── Alertes (requêtes échouées loggées dans Redis) ─────────────────────────
  async getAlerts(): Promise<Array<{ ts: string; method: string; path: string; status: number; message: string; etablissementId?: number }>> {
    const raw = await this.redis.get(ALERT_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  async pushAlert(alert: { method: string; path: string; status: number; message: string; etablissementId?: number }) {
    const alerts = await this.getAlerts();
    alerts.unshift({ ts: new Date().toISOString(), ...alert });
    if (alerts.length > MAX_ALERTS) alerts.length = MAX_ALERTS;
    await this.redis.set(ALERT_KEY, JSON.stringify(alerts), 60 * 60 * 24 * 7);
  }

  async clearAlerts() {
    await this.redis.del(ALERT_KEY);
    return { message: 'Alertes effacées' };
  }
}
