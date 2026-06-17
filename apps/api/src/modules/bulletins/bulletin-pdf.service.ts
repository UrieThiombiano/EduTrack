import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

interface LignePdf {
  matiere: string;
  moyenne: number | null;
  coefficient: number;
  pointsPonderes: number | null;
  rangMatiere: number | null;
  noteMin: number | null;
  noteMax: number | null;
  appreciation: string | null;
  enseignant: string;
}

export interface BulletinPdfData {
  etablissementNom: string;
  eleveNom: string;
  elevePrenom: string;
  eleveMatricule: string;
  classe: string;
  periode: string;
  anneeScolaire: string;
  moyenneGenerale: number | null;
  rang: number | null;
  totalEleves: number | null;
  totalAbsences: number;
  totalRetards: number;
  appreciationGenerale: string | null;
  decisionConseil: string | null;
  lignes: LignePdf[];
}

@Injectable()
export class BulletinPdfService {
  async generate(data: BulletinPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 515; // largeur utile
      const BLUE = '#1a56db';
      const DARK = '#1e2432';
      const LIGHT_GRAY = '#f0f4fa';
      const BORDER = '#d1d9e6';

      // ── En-tête établissement ───────────────────────────────────
      doc.rect(40, 40, W, 60).fill(BLUE);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
        .text(data.etablissementNom, 55, 52, { width: W - 20 });
      doc.fontSize(9).font('Helvetica')
        .text('BULLETIN DE NOTES', 55, 74, { width: W - 20 });
      doc.fillColor(DARK);

      let y = 115;

      // ── Infos élève ─────────────────────────────────────────────
      doc.rect(40, y, W, 65).fill(LIGHT_GRAY).stroke(BORDER);
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text('INFORMATIONS ÉLÈVE', 50, y + 8);

      const col1 = 50, col2 = 200, col3 = 360;
      doc.font('Helvetica').fontSize(9);
      doc.text('Nom & Prénom :', col1, y + 22).font('Helvetica-Bold')
        .text(`${data.elevePrenom} ${data.eleveNom}`, col1 + 80, y + 22);
      doc.font('Helvetica').text('Matricule :', col1, y + 36)
        .font('Helvetica-Bold').text(data.eleveMatricule, col1 + 80, y + 36);

      doc.font('Helvetica').text('Classe :', col2, y + 22)
        .font('Helvetica-Bold').text(data.classe, col2 + 55, y + 22);
      doc.font('Helvetica').text('Période :', col2, y + 36)
        .font('Helvetica-Bold').text(data.periode, col2 + 55, y + 36);

      doc.font('Helvetica').text('Année scolaire :', col3, y + 22)
        .font('Helvetica-Bold').text(data.anneeScolaire, col3 + 90, y + 22);
      doc.font('Helvetica').text('Absences :', col3, y + 36)
        .font('Helvetica-Bold').text(`${data.totalAbsences} abs. / ${data.totalRetards} ret.`, col3 + 90, y + 36);

      y += 75;

      // ── Tableau des notes ────────────────────────────────────────
      const cols = { matiere: 40, coef: 215, moy: 255, pts: 297, min: 337, max: 377, rang: 415, appreciation: 450 };
      const rowH = 18;

      // En-tête tableau
      doc.rect(40, y, W, rowH).fill(DARK);
      doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
      doc.text('MATIÈRE', cols.matiere + 2, y + 5, { width: 170 });
      doc.text('COEF', cols.coef, y + 5, { width: 35, align: 'center' });
      doc.text('MOY/20', cols.moy, y + 5, { width: 35, align: 'center' });
      doc.text('PTS', cols.pts, y + 5, { width: 35, align: 'center' });
      doc.text('MIN', cols.min, y + 5, { width: 35, align: 'center' });
      doc.text('MAX', cols.max, y + 5, { width: 35, align: 'center' });
      doc.text('RG', cols.rang, y + 5, { width: 30, align: 'center' });
      doc.text('APPRÉCIATION', cols.appreciation, y + 5, { width: 100 });
      doc.fillColor(DARK);
      y += rowH;

      // Lignes matières
      data.lignes.forEach((ligne, i) => {
        const bg = i % 2 === 0 ? 'white' : LIGHT_GRAY;
        doc.rect(40, y, W, rowH).fill(bg).stroke(BORDER);
        doc.fillColor(DARK).fontSize(7.5).font('Helvetica');

        const noteColor = ligne.moyenne !== null && ligne.moyenne < 10 ? '#dc2626' : DARK;

        doc.text(ligne.matiere, cols.matiere + 2, y + 5, { width: 168 });
        doc.text(String(ligne.coefficient), cols.coef, y + 5, { width: 35, align: 'center' });

        doc.fillColor(noteColor).font('Helvetica-Bold')
          .text(ligne.moyenne !== null ? ligne.moyenne.toFixed(2) : 'ABS', cols.moy, y + 5, { width: 35, align: 'center' });
        doc.fillColor(DARK).font('Helvetica')
          .text(ligne.pointsPonderes !== null ? ligne.pointsPonderes.toFixed(2) : '—', cols.pts, y + 5, { width: 35, align: 'center' });
        doc.text(ligne.noteMin !== null ? ligne.noteMin.toFixed(2) : '—', cols.min, y + 5, { width: 35, align: 'center' });
        doc.text(ligne.noteMax !== null ? ligne.noteMax.toFixed(2) : '—', cols.max, y + 5, { width: 35, align: 'center' });
        doc.text(ligne.rangMatiere !== null ? String(ligne.rangMatiere) : '—', cols.rang, y + 5, { width: 30, align: 'center' });
        doc.text(ligne.appreciation ?? '', cols.appreciation, y + 5, { width: 100 });

        y += rowH;
      });

      y += 10;

      // ── Résultat général ─────────────────────────────────────────
      doc.rect(40, y, W, 50).fill(BLUE);
      doc.fillColor('white').fontSize(11).font('Helvetica-Bold');

      const moyLabel = data.moyenneGenerale !== null ? `${data.moyenneGenerale.toFixed(2)}/20` : 'N/A';
      const rangLabel = data.rang !== null ? `${data.rang}${data.totalEleves ? `/${data.totalEleves}` : ''}` : '—';

      doc.text(`Moyenne générale : ${moyLabel}`, 55, y + 10);
      doc.text(`Rang : ${rangLabel}`, 280, y + 10);

      doc.fontSize(9).font('Helvetica');
      if (data.appreciationGenerale) {
        doc.text(`Appréciation : ${data.appreciationGenerale}`, 55, y + 28, { width: W - 30 });
      }
      if (data.decisionConseil) {
        doc.fillColor('#fde68a').fontSize(9).font('Helvetica-Bold')
          .text(`Décision du conseil : ${data.decisionConseil}`, 280, y + 28);
      }

      y += 60;

      // ── Signatures ───────────────────────────────────────────────
      if (y < 720) {
        doc.fillColor(DARK).fontSize(8).font('Helvetica');
        doc.text('Signature du Directeur', 60, y + 20, { width: 140, align: 'center' });
        doc.text('Signature du Titulaire', 200, y + 20, { width: 140, align: 'center' });
        doc.text('Signature du Parent/Tuteur', 370, y + 20, { width: 150, align: 'center' });

        doc.moveTo(60, y + 55).lineTo(200, y + 55).stroke(BORDER);
        doc.moveTo(200, y + 55).lineTo(340, y + 55).stroke(BORDER);
        doc.moveTo(370, y + 55).lineTo(520, y + 55).stroke(BORDER);
      }

      // ── Pied de page ─────────────────────────────────────────────
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
          .text(
            `EduTrack — PUKRI AI Systems | Généré le ${new Date().toLocaleDateString('fr-FR')} | Page ${i + 1}/${pageCount}`,
            40, 800, { width: W, align: 'center' },
          );
      }

      doc.end();
    });
  }
}
