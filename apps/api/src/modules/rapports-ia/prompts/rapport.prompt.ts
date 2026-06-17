export interface RapportPromptContext {
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  periode: string;
  moyenneGenerale: number | null;
  rang: number | null;
  totalEleves: number | null;
  totalAbsences: number;
  totalRetards: number;
  lignesBulletin: Array<{
    matiere: string;
    moyenne: number | null;
    coefficient: number;
    rangMatiere: number | null;
  }>;
  historiqueScore?: number | null;
}

export function buildRapportPrompt(ctx: RapportPromptContext): string {
  const bulletinLines = ctx.lignesBulletin
    .map(
      (l) =>
        `- ${l.matiere} : moyenne ${l.moyenne !== null ? l.moyenne.toFixed(2) : 'ABS'}/20` +
        ` | coeff ${l.coefficient}` +
        (l.rangMatiere ? ` | rang classe : ${l.rangMatiere}` : ''),
    )
    .join('\n');

  return `Tu es un conseiller pédagogique expert en suivi scolaire dans un établissement secondaire au Burkina Faso.

Analyse le bilan scolaire de l'élève ci-dessous et génère un rapport structuré en JSON.

## Élève
- Nom complet : ${ctx.elevePrenom} ${ctx.eleveNom}
- Classe : ${ctx.classe}
- Période : ${ctx.periode}

## Résultats
- Moyenne générale : ${ctx.moyenneGenerale !== null ? ctx.moyenneGenerale.toFixed(2) + '/20' : 'Non calculée'}
- Rang dans la classe : ${ctx.rang !== null ? `${ctx.rang}/${ctx.totalEleves}` : 'Non calculé'}
- Absences : ${ctx.totalAbsences} | Retards : ${ctx.totalRetards}

## Notes par matière
${bulletinLines}

## Tâche
Génère un JSON UNIQUEMENT (sans markdown, sans texte autour) avec cette structure exacte :

{
  "forces": ["string", "string", ...],
  "faiblesses": ["string", "string", ...],
  "recommandations": ["string", "string", ...],
  "evolution_recente": {
    "tendance": "hausse" | "baisse" | "stable" | "insuffisant_donnees",
    "commentaire": "string"
  },
  "score_risque": <nombre entre 0 et 100>,
  "niveau_risque": "faible" | "moyen" | "eleve" | "critique",
  "appreciation_globale": "string"
}

Règles pour score_risque :
- 0-25 : élève en bonne trajectoire
- 26-50 : quelques difficultés, surveillance recommandée
- 51-75 : difficultés importantes, intervention nécessaire
- 76-100 : situation critique, action urgente

Réponds UNIQUEMENT avec le JSON valide. Aucun texte avant ou après.`;
}
