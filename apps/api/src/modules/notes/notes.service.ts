import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { SaisieBulkDto } from './dto/saisie-bulk.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvaluation(evaluationId: number, etablissementId: number) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: { id_evaluation: evaluationId, attribution: { annee_scolaire: { id_etablissement: etablissementId } } },
      include: { attribution: { select: { id_classe: true, id_matiere: true } } },
    });
    if (!evaluation) throw new NotFoundException(`Évaluation #${evaluationId} introuvable`);

    const notes = await this.prisma.note.findMany({
      where: { id_evaluation: evaluationId },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
      },
      orderBy: { eleve: { utilisateur: { nom: 'asc' } } },
    });

    const stats = this.calculerStats(notes.map((n) => n.valeur_note ? Number(n.valeur_note) : null));

    return { evaluation, notes, stats };
  }

  async findByEleve(eleveId: number, etablissementId: number, classeId?: number) {
    const eleve = await this.prisma.eleve.findFirst({
      where: { id_eleve: eleveId, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!eleve) throw new NotFoundException(`Élève #${eleveId} introuvable`);

    return this.prisma.note.findMany({
      where: {
        id_eleve: eleveId,
        ...(classeId && { evaluation: { attribution: { id_classe: classeId } } }),
      },
      include: {
        evaluation: {
          include: {
            attribution: {
              include: {
                matiere: { select: { libelle: true, code_matiere: true } },
                classe: { select: { libelle: true } },
              },
            },
            type_evaluation: { select: { libelle: true } },
            periode_evaluation: { select: { libelle: true } },
          },
        },
      },
      orderBy: { evaluation: { date_evaluation: 'desc' } },
    });
  }

  async findOne(id: number, etablissementId: number) {
    const note = await this.prisma.note.findFirst({
      where: {
        id_note: id,
        evaluation: { attribution: { annee_scolaire: { id_etablissement: etablissementId } } },
      },
      include: {
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        evaluation: { include: { attribution: { include: { matiere: true } } } },
      },
    });
    if (!note) throw new NotFoundException(`Note #${id} introuvable`);
    return note;
  }

  async create(evaluationId: number, dto: CreateNoteDto, enseignantId: number, etablissementId: number) {
    const evaluation = await this.validerEvaluationPourSaisie(evaluationId, etablissementId);

    this.validerRegleNote(dto.valeur_note, dto.est_absent ?? false, evaluation.note_maximale);

    const eleve = await this.prisma.eleve.findFirst({
      where: { id_eleve: dto.id_eleve, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!eleve) throw new NotFoundException(`Élève #${dto.id_eleve} introuvable`);

    const exists = await this.prisma.note.findUnique({
      where: { id_evaluation_id_eleve: { id_evaluation: evaluationId, id_eleve: dto.id_eleve } },
    });
    if (exists) throw new ConflictException(`Note déjà saisie pour cet élève — utilisez PATCH /notes/${exists.id_note}`);

    const enseignant = await this.prisma.enseignant.findFirst({
      where: { id_enseignant: enseignantId, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!enseignant) throw new NotFoundException('Profil enseignant introuvable');

    return this.prisma.note.create({
      data: {
        id_evaluation: evaluationId,
        id_eleve: dto.id_eleve,
        id_enseignant_saisie: enseignant.id_enseignant,
        valeur_note: dto.valeur_note ?? null,
        est_absent: dto.est_absent ?? false,
        commentaire: dto.commentaire,
      },
      include: { eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } } },
    });
  }

  async saisieBulk(evaluationId: number, dto: SaisieBulkDto, enseignantId: number, etablissementId: number) {
    const evaluation = await this.validerEvaluationPourSaisie(evaluationId, etablissementId);

    const enseignant = await this.prisma.enseignant.findFirst({
      where: { id_enseignant: enseignantId, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!enseignant) throw new NotFoundException('Profil enseignant introuvable');

    // Valider toutes les notes avant d'insérer
    for (const item of dto.notes) {
      this.validerRegleNote(item.valeur_note, item.est_absent ?? false, evaluation.note_maximale);
    }

    // Upsert en transaction
    const results = await this.prisma.$transaction(
      dto.notes.map((item) =>
        this.prisma.note.upsert({
          where: { id_evaluation_id_eleve: { id_evaluation: evaluationId, id_eleve: item.id_eleve } },
          create: {
            id_evaluation: evaluationId,
            id_eleve: item.id_eleve,
            id_enseignant_saisie: enseignant.id_enseignant,
            valeur_note: item.valeur_note ?? null,
            est_absent: item.est_absent ?? false,
            commentaire: item.commentaire,
          },
          update: {
            id_enseignant_saisie: enseignant.id_enseignant,
            valeur_note: item.valeur_note ?? null,
            est_absent: item.est_absent ?? false,
            commentaire: item.commentaire,
          },
        }),
      ),
    );

    return { count: results.length, message: `${results.length} note(s) enregistrée(s)` };
  }

  async update(id: number, dto: Omit<Partial<CreateNoteDto>, 'id_eleve'>, etablissementId: number) {
    const note = await this.findOne(id, etablissementId);

    if (note.evaluation.statut === 'archive') {
      throw new BadRequestException('Impossible de modifier une note d\'une évaluation archivée');
    }

    this.validerRegleNote(
      dto.valeur_note ?? (note.valeur_note ? Number(note.valeur_note) : null),
      dto.est_absent ?? note.est_absent,
      note.evaluation.note_maximale,
    );

    return this.prisma.note.update({
      where: { id_note: id },
      data: {
        valeur_note: dto.valeur_note ?? null,
        est_absent: dto.est_absent,
        commentaire: dto.commentaire,
      },
    });
  }

  async remove(id: number, etablissementId: number) {
    const note = await this.findOne(id, etablissementId);
    if (note.evaluation.statut !== 'brouillon') {
      throw new BadRequestException('Seules les notes d\'une évaluation en brouillon peuvent être supprimées');
    }
    return this.prisma.note.delete({ where: { id_note: id } });
  }

  // ── Helpers privés ────────────────────────────────────────────────

  private async validerEvaluationPourSaisie(evaluationId: number, etablissementId: number) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: {
        id_evaluation: evaluationId,
        attribution: { annee_scolaire: { id_etablissement: etablissementId } },
      },
    });
    if (!evaluation) throw new NotFoundException(`Évaluation #${evaluationId} introuvable`);
    if (evaluation.statut === 'archive') throw new BadRequestException('Évaluation archivée : saisie impossible');
    return evaluation;
  }

  private validerRegleNote(valeur: number | null | undefined, estAbsent: boolean, noteMax: unknown) {
    const max = noteMax ? Number(noteMax) : 20;

    if (estAbsent && valeur !== null && valeur !== undefined) {
      throw new BadRequestException('valeur_note doit être null si est_absent = true');
    }
    if (!estAbsent && (valeur === null || valeur === undefined)) {
      throw new BadRequestException('valeur_note est requise si l\'élève n\'est pas absent');
    }
    if (!estAbsent && valeur !== null && valeur !== undefined && valeur > max) {
      throw new BadRequestException(`La note (${valeur}) dépasse la note maximale (${max})`);
    }
  }

  private calculerStats(valeurs: (number | null)[]) {
    const valides = valeurs.filter((v): v is number => v !== null);
    if (valides.length === 0) return { min: null, max: null, moyenne: null, absents: valeurs.length };

    const min = Math.min(...valides);
    const max = Math.max(...valides);
    const moyenne = valides.reduce((a, b) => a + b, 0) / valides.length;
    const absents = valeurs.length - valides.length;

    return { min, max, moyenne: Math.round(moyenne * 100) / 100, absents };
  }
}
