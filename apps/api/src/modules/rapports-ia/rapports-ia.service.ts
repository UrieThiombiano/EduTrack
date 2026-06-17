import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service';
import { GenererRapportDto } from './dto/generer-rapport.dto';
import { buildRapportPrompt } from './prompts/rapport.prompt';
import { paginate } from '../../common/helpers/pagination.helper';
import { QueryDto } from '../../common/dto/query.dto';

@Injectable()
export class RapportsIaService {
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: this.config.get<string>('anthropic.apiKey') });
    this.model = this.config.get<string>('anthropic.model') ?? 'claude-sonnet-4-6';
  }

  async findAll(etablissementId: number, query: QueryDto) {
    const where = {
      eleve: { utilisateur: { id_etablissement: etablissementId } },
    };
    const [data, total] = await Promise.all([
      this.prisma.rapportIA.findMany({
        where,
        include: {
          eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          periode: { select: { libelle: true, type_periode: true } },
        },
        orderBy: { date_generation: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.rapportIA.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const rapport = await this.prisma.rapportIA.findFirst({
      where: { id_rapport_ia: id, eleve: { utilisateur: { id_etablissement: etablissementId } } },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        periode: { select: { libelle: true, type_periode: true } },
      },
    });
    if (!rapport) throw new NotFoundException(`Rapport IA #${id} introuvable`);
    return rapport;
  }

  async findByEleve(eleveId: number, etablissementId: number) {
    const eleve = await this.prisma.eleve.findFirst({
      where: { id_eleve: eleveId, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!eleve) throw new NotFoundException(`Élève #${eleveId} introuvable`);

    return this.prisma.rapportIA.findMany({
      where: { id_eleve: eleveId },
      include: { periode: { select: { libelle: true, type_periode: true } } },
      orderBy: { date_generation: 'desc' },
    });
  }

  async generer(dto: GenererRapportDto, etablissementId: number) {
    // Vérifier que le bulletin existe et est publié
    const bulletin = await this.prisma.bulletin.findFirst({
      where: {
        id_eleve: dto.id_eleve,
        id_periode: dto.id_periode,
        classe: { annee_scolaire: { id_etablissement: etablissementId } },
      },
      include: {
        eleve: {
          include: { utilisateur: { select: { nom: true, prenom: true } } },
        },
        periode: { select: { libelle: true, type_periode: true } },
        classe: { select: { libelle: true } },
        lignes: {
          include: { matiere: { select: { libelle: true } } },
        },
      },
    });

    if (!bulletin) {
      throw new NotFoundException(`Aucun bulletin trouvé pour l'élève #${dto.id_eleve} sur la période #${dto.id_periode}`);
    }
    if (!bulletin.est_publie) {
      throw new BadRequestException('Le bulletin doit être publié avant de générer un rapport IA');
    }

    // Construire le prompt
    const prompt = buildRapportPrompt({
      eleveNom: bulletin.eleve.utilisateur.nom,
      elevePrenom: bulletin.eleve.utilisateur.prenom,
      classe: bulletin.classe.libelle,
      periode: bulletin.periode.libelle ?? bulletin.periode.type_periode,
      moyenneGenerale: bulletin.moyenne_generale ? Number(bulletin.moyenne_generale) : null,
      rang: bulletin.rang,
      totalEleves: bulletin.total_eleves_classe,
      totalAbsences: bulletin.total_absences,
      totalRetards: bulletin.total_retards,
      lignesBulletin: bulletin.lignes.map((l) => ({
        matiere: l.matiere.libelle,
        moyenne: l.moyenne_matiere ? Number(l.moyenne_matiere) : null,
        coefficient: Number(l.coefficient ?? 1),
        rangMatiere: l.rang_matiere,
      })),
    });

    // Appel Anthropic API
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new BadRequestException(`Le modèle IA a retourné une réponse non-JSON : ${rawText.slice(0, 200)}`);
    }

    // Persister le rapport (create ou update)
    const payload = {
      forces: parsed.forces ?? [],
      faiblesses: parsed.faiblesses ?? [],
      recommandations: parsed.recommandations ?? [],
      evolution_recente: parsed.evolution_recente ?? null,
      score_risque: parsed.score_risque ?? null,
      niveau_risque: parsed.niveau_risque ?? null,
      version_modele: this.model,
      date_generation: new Date(),
    };
    const include = {
      eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
      periode: { select: { libelle: true } },
    };

    const existing = await this.prisma.rapportIA.findFirst({
      where: { id_eleve: dto.id_eleve, id_periode: dto.id_periode },
      select: { id_rapport_ia: true },
    });

    const rapport = existing
      ? await this.prisma.rapportIA.update({ where: { id_rapport_ia: existing.id_rapport_ia }, data: payload, include })
      : await this.prisma.rapportIA.create({ data: { id_eleve: dto.id_eleve, id_periode: dto.id_periode, ...payload }, include });

    return { rapport, appreciation_globale: parsed.appreciation_globale };
  }
}
