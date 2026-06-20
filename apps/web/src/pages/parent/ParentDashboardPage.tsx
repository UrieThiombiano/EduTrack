import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, AlertCircle, FileText, BookOpen, Shield, BarChart3, Download, ChevronDown } from 'lucide-react';
import { espaceParentService } from '../../services/api/espace-parent.service';
import { bulletinsService } from '../../services/api/bulletins.service';
import { useAuth } from '../../hooks/useAuth';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatNote } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';

const riskColors = { faible: 'success', moyen: 'warning', eleve: 'danger', critique: 'danger' } as const;

function Section({ title, icon: Icon, color = 'text-primary', children, defaultOpen = true }: {
  title: string; icon: React.ElementType; color?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-5 py-4 hover:bg-muted/50 transition"
        onClick={() => setOpen(o => !o)}
      >
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const token = useAuthStore(s => s.accessToken);
  const [selectedEnfant, setSelectedEnfant] = useState<number | null>(null);

  const { data: enfants, isLoading } = useQuery({
    queryKey: ['parent-enfants'],
    queryFn: espaceParentService.mesEnfants,
  });

  const activeEnfantId = selectedEnfant ?? enfants?.[0]?.id_eleve ?? null;

  const { data: notes } = useQuery({
    queryKey: ['parent-notes', activeEnfantId],
    queryFn: () => espaceParentService.notes(activeEnfantId!),
    enabled: !!activeEnfantId,
  });

  const { data: absences } = useQuery({
    queryKey: ['parent-absences', activeEnfantId],
    queryFn: () => espaceParentService.absences(activeEnfantId!),
    enabled: !!activeEnfantId,
  });

  const { data: sanctions } = useQuery({
    queryKey: ['parent-sanctions', activeEnfantId],
    queryFn: () => espaceParentService.sanctions(activeEnfantId!),
    enabled: !!activeEnfantId,
  });

  const { data: bulletins } = useQuery({
    queryKey: ['parent-bulletins', activeEnfantId],
    queryFn: () => espaceParentService.bulletins(activeEnfantId!),
    enabled: !!activeEnfantId,
  });

  const { data: rapports } = useQuery({
    queryKey: ['parent-rapports', activeEnfantId],
    queryFn: () => espaceParentService.rapportsIA(activeEnfantId!),
    enabled: !!activeEnfantId,
  });

  if (isLoading) return <FullPageSpinner />;

  if (!enfants?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Heart className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-foreground font-medium">Aucun enfant enregistré</p>
        <p className="text-muted-foreground text-sm mt-1">Contactez l'administration pour lier votre compte à vos enfants.</p>
      </div>
    );
  }

  const activeEnfant = enfants.find((e: any) => e.id_eleve === activeEnfantId);

  const downloadBulletin = async (bulletinId: number) => {
    const url = bulletinsService.downloadPdfUrl(bulletinId);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bulletin-${bulletinId}.pdf`;
    a.click();
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Bienvenue */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Bonjour, {user?.prenom} 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Suivi scolaire de vos enfants</p>
      </div>

      {/* Sélecteur d'enfant si plusieurs */}
      {enfants.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {enfants.map((e: any) => (
            <button
              key={e.id_eleve}
              onClick={() => setSelectedEnfant(e.id_eleve)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition border',
                activeEnfantId === e.id_eleve
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {e.utilisateur.prenom} {e.utilisateur.nom}
            </button>
          ))}
        </div>
      )}

      {/* Carte enfant actif */}
      {activeEnfant && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {activeEnfant.utilisateur.prenom[0]}{activeEnfant.utilisateur.nom[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">{activeEnfant.utilisateur.prenom} {activeEnfant.utilisateur.nom}</p>
              <p className="text-sm text-muted-foreground">
                {activeEnfant.classe_actuelle?.libelle ?? 'Classe non assignée'}
                {activeEnfant.classe_actuelle?.annee_scolaire && ` · ${activeEnfant.classe_actuelle.annee_scolaire.libelle}`}
              </p>
            </div>
            <div className="ml-auto flex gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-red-400">{activeEnfant.stats?.totalAbsences ?? 0}</p>
                <p className="text-xs text-muted-foreground">Absences</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">{activeEnfant.stats?.totalRetards ?? 0}</p>
                <p className="text-xs text-muted-foreground">Retards</p>
              </div>
              {activeEnfant.dernier_bulletin && (
                <div>
                  <p className="text-xl font-bold text-emerald-400">
                    {activeEnfant.dernier_bulletin.moyenne_generale
                      ? Number(activeEnfant.dernier_bulletin.moyenne_generale).toFixed(2)
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Dernière moy.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulletins */}
      <Section title={`Bulletins (${bulletins?.length ?? 0})`} icon={FileText} color="text-violet-400">
        {bulletins?.length ? (
          <div className="space-y-2">
            {bulletins.map((b: any) => (
              <div key={b.id_bulletin} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{b.periode?.libelle ?? b.periode?.type_periode}</p>
                  <p className="text-xs text-muted-foreground">{b.classe?.libelle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', b.moyenne_generale < 10 ? 'text-red-400' : 'text-emerald-400')}>
                      {formatNote(b.moyenne_generale ? Number(b.moyenne_generale) : null)}
                    </p>
                    <p className="text-xs text-muted-foreground">Rang {b.rang ?? '—'}/{b.total_eleves_classe ?? '?'}</p>
                  </div>
                  <button onClick={() => downloadBulletin(b.id_bulletin)} className="p-1.5 rounded hover:bg-muted transition" title="Télécharger PDF">
                    <Download className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Aucun bulletin publié.</p>}
      </Section>

      {/* Notes */}
      <Section title={`Notes récentes (${notes?.length ?? 0})`} icon={BookOpen} color="text-blue-400" defaultOpen={false}>
        {notes?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2">Matière</th>
                  <th className="pb-2">Évaluation</th>
                  <th className="pb-2 text-right">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notes.slice(0, 10).map((n: any) => (
                  <tr key={n.id_note}>
                    <td className="py-2">{n.evaluation?.attribution?.matiere?.libelle ?? '—'}</td>
                    <td className="py-2 text-muted-foreground text-xs">{n.evaluation?.intitule ?? n.evaluation?.type_evaluation?.libelle}</td>
                    <td className="py-2 text-right">
                      {n.est_absent
                        ? <Badge variant="danger">Absent</Badge>
                        : <span className={cn('font-medium', n.valeur_note < 10 ? 'text-red-400' : 'text-foreground')}>{Number(n.valeur_note).toFixed(2)}/20</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">Aucune note enregistrée.</p>}
      </Section>

      {/* Absences */}
      <Section title={`Absences & Retards (${absences?.length ?? 0})`} icon={AlertCircle} color="text-amber-400" defaultOpen={false}>
        {absences?.length ? (
          <ul className="space-y-2">
            {absences.slice(0, 8).map((a: any) => (
              <li key={a.id_absence} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{formatDate(a.date_absence, 'dd/MM/yyyy')}</span>
                  <span className="text-muted-foreground text-xs ml-2">{a.emploi_du_temps?.attribution?.matiere?.libelle}</span>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant={a.type_absence === 'retard' ? 'warning' : 'danger'}>{a.type_absence}</Badge>
                  {a.est_justifie && <Badge variant="success">justifiée</Badge>}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Aucune absence enregistrée.</p>}
      </Section>

      {/* Sanctions */}
      {sanctions && sanctions.length > 0 && (
        <Section title={`Sanctions (${sanctions.length})`} icon={Shield} color="text-red-400" defaultOpen={false}>
          <ul className="space-y-2">
            {sanctions.map((s: any) => (
              <li key={s.id_sanction} className="border border-border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize">{s.type_sanction.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(s.date_sanction, 'dd/MM/yyyy')}</span>
                </div>
                <p className="text-muted-foreground">{s.motif}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Rapports IA */}
      {rapports && rapports.length > 0 && (
        <Section title="Analyse IA" icon={BarChart3} color="text-emerald-400" defaultOpen={false}>
          {rapports.slice(0, 2).map((r: any) => (
            <div key={r.id_rapport_ia} className="border border-border rounded-lg p-4 mb-3 last:mb-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.periode?.libelle}</span>
                {r.niveau_risque && (
                  <Badge variant={(riskColors as any)[r.niveau_risque] ?? 'muted'}>
                    Risque {r.niveau_risque} · {Number(r.score_risque).toFixed(0)}/100
                  </Badge>
                )}
              </div>
              {r.recommandations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-400 mb-1">Recommandations</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {r.recommandations.slice(0, 3).map((rec: string, i: number) => <li key={i}>· {rec}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
