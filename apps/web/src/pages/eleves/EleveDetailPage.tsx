import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, BookOpen, AlertCircle, FileText, BarChart3 } from 'lucide-react';
import { elevesService } from '../../services/api/eleves.service';
import { absencesService } from '../../services/api/absences.service';
import { bulletinsService } from '../../services/api/bulletins.service';
import { rapportsIaService } from '../../services/api/rapports-ia.service';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/PageHeader';
import { formatDate, formatNote } from '../../lib/utils';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function EleveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eleveId = parseInt(id ?? '0');
  const navigate = useNavigate();

  const { data: eleve, isLoading } = useQuery({
    queryKey: ['eleve', eleveId],
    queryFn: () => elevesService.findOne(eleveId),
    enabled: !!eleveId,
  });

  const { data: absences } = useQuery({
    queryKey: ['absences', { id_eleve: eleveId }],
    queryFn: () => absencesService.findAll({ id_eleve: eleveId, limit: 10 }),
    enabled: !!eleveId,
  });

  const { data: bulletins } = useQuery({
    queryKey: ['bulletins', { id_eleve: eleveId }],
    queryFn: () => bulletinsService.findAll({ id_eleve: eleveId, limit: 10 }),
    enabled: !!eleveId,
  });

  const { data: rapports } = useQuery({
    queryKey: ['rapports-ia', eleveId],
    queryFn: () => rapportsIaService.findByEleve(eleveId),
    enabled: !!eleveId,
  });

  if (isLoading) return <FullPageSpinner />;
  if (!eleve) return <p className="text-muted-foreground">Élève introuvable.</p>;

  const riskColors = { faible: 'success', moyen: 'warning', eleve: 'danger', critique: 'danger' } as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Btn>
        <div>
          <h1 className="text-xl font-bold text-foreground">{eleve.utilisateur.prenom} {eleve.utilisateur.nom}</h1>
          <p className="text-muted-foreground text-sm">{eleve.matricule}</p>
        </div>
        <Badge variant={eleve.est_actif ? 'success' : 'muted'} className="ml-auto">
          {eleve.est_actif ? 'Actif' : 'Inactif'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Infos */}
        <Section title="Informations" icon={User}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd>{eleve.utilisateur.email ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Naissance</dt><dd>{eleve.date_naissance ? formatDate(eleve.date_naissance, 'dd/MM/yyyy') : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Sexe</dt><dd>{eleve.sexe ?? '—'}</dd></div>
          </dl>
        </Section>

        {/* Absences */}
        <Section title={`Absences (${absences?.meta.total ?? 0})`} icon={AlertCircle}>
          {absences?.data.length ? (
            <ul className="space-y-1.5 text-sm">
              {absences.data.slice(0, 5).map((a) => (
                <li key={a.id_absence} className="flex items-center justify-between">
                  <span>{formatDate(a.date_absence, 'dd/MM/yyyy')}</span>
                  <div className="flex gap-1">
                    <Badge variant={a.type_absence === 'retard' ? 'warning' : 'danger'}>{a.type_absence}</Badge>
                    {a.est_justifie && <Badge variant="success">justifiée</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Aucune absence.</p>}
        </Section>

        {/* Bulletins */}
        <Section title={`Bulletins (${bulletins?.meta.total ?? 0})`} icon={FileText}>
          {bulletins?.data.length ? (
            <ul className="space-y-1.5 text-sm">
              {bulletins.data.map((b) => (
                <li key={b.id_bulletin} className="flex items-center justify-between">
                  <span>{b.periode.libelle ?? b.periode.type_periode}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatNote(b.moyenne_generale)}</span>
                    {b.est_publie && <Badge variant="success">publié</Badge>}
                    {b.est_publie && (
                      <a href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'}/bulletins/${b.id_bulletin}/pdf`}
                        target="_blank" className="text-primary hover:underline text-xs">PDF</a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Aucun bulletin.</p>}
        </Section>
      </div>

      {/* Rapports IA */}
      {rapports && rapports.length > 0 && (
        <Section title="Rapports IA" icon={BarChart3}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rapports.map((r) => (
              <div key={r.id_rapport_ia} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.periode.libelle ?? 'Période'}</span>
                  {r.niveau_risque && (
                    <Badge variant={riskColors[r.niveau_risque] ?? 'muted'}>
                      Risque {r.niveau_risque} — {r.score_risque?.toFixed(0)}/100
                    </Badge>
                  )}
                </div>
                {r.forces?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 mb-1">Forces</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">{r.forces.map((f, i) => <li key={i}>· {f}</li>)}</ul>
                  </div>
                )}
                {r.recommandations?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-400 mb-1">Recommandations</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">{r.recommandations.slice(0, 2).map((rec, i) => <li key={i}>· {rec}</li>)}</ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
