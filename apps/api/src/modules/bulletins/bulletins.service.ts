import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulletinPdfService } from './bulletin-pdf.service';
import { GenererBulletinsDto } from './dto/generer-bulletins.dto';
import { QueryBulletinDto } from './dto/query-bulletin.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class BulletinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: BulletinPdfService,
  ) {}

  async findAll(etablissementId: number, query: QueryBulletinDto) {
    const where: any = {
      classe: { annee_scolaire: { id_etablissement: etablissementId } },
    };
    if (query.id_eleve) where.id_eleve = query.id_eleve;
    if (query.id_periode) where.id_periode = query.id_periode;
    if (query.id_classe) where.id_classe = query.id_classe;
    if (query.est_publie !== undefined) where.est_publie = query.est_publie === 'true';

    const [data, total] = await Promise.all([
      this.prisma.bulletin.findMany({
        where,
        include: {
          eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          periode: { select: { libelle: true, type_periode: true } },
          classe: { select: { libelle: true, code_classe: true } },
          lignes: {
            include: {
              matiere: { select: { libelle: true, code_matiere: true } },
              enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
            },
            orderBy: { matiere: { libelle: 'asc' } },
          },
        },
        orderBy: [{ classe: { libelle: 'asc' } }, { rang: 'asc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.bulletin.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: number, etablissementId: number) {
    const bulletin = await this.prisma.bulletin.findFirst({
      where: { id_bulletin: id, classe: { annee_scolaire: { id_etablissement: etablissementId } } },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        periode: true,
        classe: { select: { libelle: true } },
        lignes: {
          include: {
            matiere: { select: { libelle: true, code_matiere: true } },
            enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
        },
      },
    });
    if (!bulletin) throw new NotFoundException(`Bulletin #${id} introuvable`);
    return bulletin;
  }

  async generer(dto: GenererBulletinsDto, etablissementId: number) {
    // Vérifier classe et période appartiennent à l'établissement
    const classe = await this.prisma.classe.findFirst({
      where: { id_classe: dto.id_classe, annee_scolaire: { id_etablissement: etablissementId } },
      include: { niveau: true, annee_scolaire: true },
    });
    if (!classe) throw new NotFoundException(`Classe #${dto.id_classe} introuvable`);

    const periode = await this.prisma.periode.findFirst({
      where: { id_periode: dto.id_periode, annee_scolaire: { id_etablissement: etablissementId } },
    });
    if (!periode) throw new NotFoundException(`Période #${dto.id_periode} introuvable`);

    // Récupérer tous les élèves inscrits dans la classe
    const inscriptions = await this.prisma.inscription.findMany({
      where: { id_classe: dto.id_classe, statut: 'inscrit' },
      include: { eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } } },
    });
    if (inscriptions.length === 0) throw new BadRequestException('Aucun élève inscrit dans cette classe');

    // Récupérer toutes les attributions actives de la classe pour cette année
    const attributions = await this.prisma.attributionEnseignant.findMany({
      where: { id_classe: dto.id_classe, id_annee_scolaire: classe.id_annee_scolaire, est_actif: true },
      include: {
        matiere: true,
        enseignant: true,
      },
    });

    // Récupérer les coefficients de la classe (via le niveau)
    const coefficients = await this.prisma.coefficient.findMany({
      where: {
        id_niveau: classe.id_niveau,
        id_matiere: { in: attributions.map((a) => a.id_matiere) },
      },
    });
    const coefMap = new Map(coefficients.map((c) => [c.id_matiere, Number(c.valeur)]));

    // Récupérer les période_evaluations de cette période
    const periodesEval = await this.prisma.periodeEvaluation.findMany({
      where: { id_periode: dto.id_periode },
    });
    const periodeEvalIds = periodesEval.map((p) => p.id_periode_evaluation);

    // Pour chaque attribution, calculer les moyennes de tous les élèves
    const moyennesParAttribution: Map<number, Map<number, number | null>> = new Map();

    for (const attr of attributions) {
      const eleveMap = new Map<number, number | null>();

      for (const insc of inscriptions) {
        const notes = await this.prisma.note.findMany({
          where: {
            id_eleve: insc.id_eleve,
            evaluation: {
              id_attribution: attr.id_attribution,
              id_periode_evaluation: { in: periodeEvalIds },
            },
            est_absent: false,
          },
          include: { evaluation: { include: { type_evaluation: true } } },
        });

        if (notes.length === 0) {
          eleveMap.set(insc.id_eleve, null);
        } else {
          // Moyenne simple (toutes les évals de la même attribution/période)
          const total = notes.reduce((sum, n) => sum + Number(n.valeur_note ?? 0), 0);
          eleveMap.set(insc.id_eleve, total / notes.length);
        }
      }

      moyennesParAttribution.set(attr.id_attribution, eleveMap);
    }

    // Pour chaque élève — calculer moyenne générale pondérée
    const resultatsEleves: Array<{
      eleveId: number;
      moyenneGenerale: number | null;
      lignes: Array<{
        idAttribution: number;
        idMatiere: number;
        idEnseignant: number;
        moyenne: number | null;
        coefficient: number;
        pointsPonderes: number | null;
      }>;
      totalAbsences: number;
      totalRetards: number;
    }> = [];

    for (const insc of inscriptions) {
      const lignes: any[] = [];
      let totalPoints = 0;
      let totalCoefs = 0;
      let hasAnyMoyenne = false;

      for (const attr of attributions) {
        const coef = coefMap.get(attr.id_matiere) ?? 1;
        const moyenne = moyennesParAttribution.get(attr.id_attribution)?.get(insc.id_eleve) ?? null;
        const pointsPonderes = moyenne !== null ? moyenne * coef : null;

        if (moyenne !== null) {
          totalPoints += moyenne * coef;
          totalCoefs += coef;
          hasAnyMoyenne = true;
        }

        lignes.push({
          idAttribution: attr.id_attribution,
          idMatiere: attr.id_matiere,
          idEnseignant: attr.id_enseignant,
          moyenne,
          coefficient: coef,
          pointsPonderes,
        });
      }

      const moyenneGenerale = hasAnyMoyenne && totalCoefs > 0 ? totalPoints / totalCoefs : null;

      // Compter absences/retards de la période
      const [totalAbsences, totalRetards] = await Promise.all([
        this.prisma.absence.count({
          where: {
            id_eleve: insc.id_eleve,
            id_classe: dto.id_classe,
            type_absence: 'absence',
            date_absence: { gte: periode.date_debut ?? undefined, lte: periode.date_fin ?? undefined },
          },
        }),
        this.prisma.absence.count({
          where: {
            id_eleve: insc.id_eleve,
            id_classe: dto.id_classe,
            type_absence: 'retard',
            date_absence: { gte: periode.date_debut ?? undefined, lte: periode.date_fin ?? undefined },
          },
        }),
      ]);

      resultatsEleves.push({ eleveId: insc.id_eleve, moyenneGenerale, lignes, totalAbsences, totalRetards });
    }

    // Calculer les rangs (tri par moyenne descendante)
    const sorted = [...resultatsEleves].sort((a, b) => {
      if (a.moyenneGenerale === null) return 1;
      if (b.moyenneGenerale === null) return -1;
      return b.moyenneGenerale - a.moyenneGenerale;
    });
    const rangMap = new Map(sorted.map((e, i) => [e.eleveId, i + 1]));

    // Pour chaque matière, calculer min/max de la classe
    const statsMatiere = new Map<number, { min: number | null; max: number | null }>();
    for (const attr of attributions) {
      const vals: number[] = [];
      for (const insc of inscriptions) {
        const m = moyennesParAttribution.get(attr.id_attribution)?.get(insc.id_eleve);
        if (m !== null && m !== undefined) vals.push(m);
      }
      statsMatiere.set(attr.id_matiere, {
        min: vals.length > 0 ? Math.min(...vals) : null,
        max: vals.length > 0 ? Math.max(...vals) : null,
      });
    }

    // Pour chaque matière — rangs dans la classe
    const rangMatiereMap = new Map<number, Map<number, number>>();
    for (const attr of attributions) {
      const sorted = resultatsEleves
        .map((e) => ({ eleveId: e.eleveId, m: moyennesParAttribution.get(attr.id_attribution)?.get(e.eleveId) ?? null }))
        .filter((x) => x.m !== null)
        .sort((a, b) => (b.m as number) - (a.m as number));
      const rm = new Map(sorted.map((x, i) => [x.eleveId, i + 1]));
      rangMatiereMap.set(attr.id_matiere, rm);
    }

    // Générer les bulletins en transaction
    const bulletinsGeneres = await this.prisma.$transaction(async (tx) => {
      const created: any[] = [];

      for (const resultat of resultatsEleves) {
        const rang = rangMap.get(resultat.eleveId) ?? null;

        // Upsert bulletin (unicité id_eleve + id_periode)
        const existing = await tx.bulletin.findUnique({
          where: { id_eleve_id_periode: { id_eleve: resultat.eleveId, id_periode: dto.id_periode } },
        });

        if (existing?.est_publie) {
          throw new BadRequestException(
            `Le bulletin de l'élève #${resultat.eleveId} pour cette période est déjà publié — impossible de régénérer`,
          );
        }

        let bulletin: any;
        if (existing) {
          // Supprimer les lignes existantes avant mise à jour
          await tx.ligneBulletin.deleteMany({ where: { id_bulletin: existing.id_bulletin } });
          bulletin = await tx.bulletin.update({
            where: { id_bulletin: existing.id_bulletin },
            data: {
              id_classe: dto.id_classe,
              moyenne_generale: resultat.moyenneGenerale,
              rang,
              total_eleves_classe: inscriptions.length,
              total_absences: resultat.totalAbsences,
              total_retards: resultat.totalRetards,
              date_generation: new Date(),
            },
          });
        } else {
          bulletin = await tx.bulletin.create({
            data: {
              id_eleve: resultat.eleveId,
              id_periode: dto.id_periode,
              id_classe: dto.id_classe,
              moyenne_generale: resultat.moyenneGenerale,
              rang,
              total_eleves_classe: inscriptions.length,
              total_absences: resultat.totalAbsences,
              total_retards: resultat.totalRetards,
              date_generation: new Date(),
            },
          });
        }

        // Créer les lignes de bulletin
        for (const ligne of resultat.lignes) {
          const stats = statsMatiere.get(ligne.idMatiere);
          const rangMatiere = rangMatiereMap.get(ligne.idMatiere)?.get(resultat.eleveId) ?? null;

          await tx.ligneBulletin.create({
            data: {
              id_bulletin: bulletin.id_bulletin,
              id_matiere: ligne.idMatiere,
              id_enseignant: ligne.idEnseignant,
              moyenne_matiere: ligne.moyenne,
              coefficient: ligne.coefficient,
              points_ponderes: ligne.pointsPonderes,
              rang_matiere: rangMatiere,
              note_min_classe: stats?.min ?? null,
              note_max_classe: stats?.max ?? null,
            },
          });
        }

        created.push(bulletin);
      }

      return created;
    });

    return {
      count: bulletinsGeneres.length,
      message: `${bulletinsGeneres.length} bulletin(s) généré(s) pour la classe`,
      bulletins: bulletinsGeneres,
    };
  }

  async publier(id: number, etablissementId: number) {
    const bulletin = await this.findOne(id, etablissementId);
    if (bulletin.est_publie) throw new BadRequestException('Bulletin déjà publié — immuable');

    const published = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.bulletin.update({
        where: { id_bulletin: id },
        data: { est_publie: true },
        include: {
          eleve: { include: { utilisateur: true, liens_parents: { include: { parent: { include: { utilisateur: true } } } } } },
          periode: { select: { libelle: true, type_periode: true } },
          classe: { select: { libelle: true } },
        },
      });

      // Notifications aux parents
      const eleveNom = `${updated.eleve.utilisateur.prenom} ${updated.eleve.utilisateur.nom}`;
      const titre = 'Bulletin disponible';
      const contenu = `Le bulletin de ${eleveNom} pour la période "${updated.periode.libelle ?? updated.periode.type_periode}" est disponible.`;

      for (const lien of updated.eleve.liens_parents) {
        if (lien.parent.utilisateur.id_etablissement === etablissementId) {
          await tx.notification.create({
            data: {
              id_destinataire: lien.parent.utilisateur.id_utilisateur,
              type_notification: 'bulletin',
              canal: 'in_app',
              titre,
              contenu,
              est_envoye: true,
              date_envoi: new Date(),
              metadata: { id_bulletin: id },
            },
          });
        }
      }

      return updated;
    });

    return published;
  }

  async generatePdf(id: number, etablissementId: number): Promise<Buffer> {
    const bulletin = await this.prisma.bulletin.findFirst({
      where: { id_bulletin: id, classe: { annee_scolaire: { id_etablissement: etablissementId } } },
      include: {
        eleve: {
          include: {
            utilisateur: { select: { nom: true, prenom: true } },
          },
        },
        periode: { select: { libelle: true, type_periode: true } },
        classe: {
          include: {
            annee_scolaire: { select: { libelle: true } },
            niveau: { select: { libelle: true } },
          },
        },
        lignes: {
          include: {
            matiere: { select: { libelle: true } },
            enseignant: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
          orderBy: { matiere: { libelle: 'asc' } },
        },
      },
    });
    if (!bulletin) throw new NotFoundException(`Bulletin #${id} introuvable`);

    const etablissement = await this.prisma.etablissement.findUnique({
      where: { id_etablissement: etablissementId },
      select: { nom: true },
    });

    const eleve = await this.prisma.eleve.findUnique({
      where: { id_eleve: bulletin.id_eleve },
      select: { matricule: true },
    });

    return this.pdfService.generate({
      etablissementNom: etablissement?.nom ?? 'Établissement',
      eleveNom: bulletin.eleve.utilisateur.nom,
      elevePrenom: bulletin.eleve.utilisateur.prenom,
      eleveMatricule: eleve?.matricule ?? '—',
      classe: bulletin.classe.libelle,
      periode: bulletin.periode.libelle ?? bulletin.periode.type_periode,
      anneeScolaire: (bulletin.classe as any).annee_scolaire?.libelle ?? '—',
      moyenneGenerale: bulletin.moyenne_generale ? Number(bulletin.moyenne_generale) : null,
      rang: bulletin.rang,
      totalEleves: bulletin.total_eleves_classe,
      totalAbsences: bulletin.total_absences,
      totalRetards: bulletin.total_retards,
      appreciationGenerale: bulletin.appreciation_generale ?? null,
      decisionConseil: bulletin.decision_conseil ?? null,
      lignes: bulletin.lignes.map((l) => ({
        matiere: l.matiere.libelle,
        moyenne: l.moyenne_matiere ? Number(l.moyenne_matiere) : null,
        coefficient: Number(l.coefficient ?? 1),
        pointsPonderes: l.points_ponderes ? Number(l.points_ponderes) : null,
        rangMatiere: l.rang_matiere,
        noteMin: l.note_min_classe ? Number(l.note_min_classe) : null,
        noteMax: l.note_max_classe ? Number(l.note_max_classe) : null,
        appreciation: l.appreciation_enseignant ?? null,
        enseignant: `${l.enseignant.utilisateur.prenom} ${l.enseignant.utilisateur.nom}`,
      })),
    });
  }

  async publierClasse(dto: GenererBulletinsDto, etablissementId: number) {
    const classe = await this.prisma.classe.findFirst({
      where: { id_classe: dto.id_classe, annee_scolaire: { id_etablissement: etablissementId } },
    });
    if (!classe) throw new NotFoundException(`Classe #${dto.id_classe} introuvable`);

    const bulletins = await this.prisma.bulletin.findMany({
      where: { id_classe: dto.id_classe, id_periode: dto.id_periode, est_publie: false },
    });
    if (bulletins.length === 0) throw new BadRequestException('Aucun bulletin non publié trouvé pour cette classe/période');

    const results = await Promise.all(bulletins.map((b) => this.publier(b.id_bulletin, etablissementId)));
    return { count: results.length, message: `${results.length} bulletin(s) publié(s)` };
  }
}
