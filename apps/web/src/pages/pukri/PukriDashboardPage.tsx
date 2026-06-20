import { useQuery } from '@tanstack/react-query';
import { Building2, Users, GraduationCap, UserCheck, BookOpen, AlertTriangle, FileText } from 'lucide-react';
import { superAdminService } from '../../services/api/super-admin.service';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        </div>
        <div className={`p-2.5 rounded-lg bg-muted ${color}`}><Icon className="w-5 h-5" /></div>
      </div>
    </div>
  );
}

export default function PukriDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['pukri-stats'],
    queryFn: superAdminService.getStats,
    refetchInterval: 60_000,
  });

  if (isLoading) return <FullPageSpinner />;

  const p = stats?.plateforme;
  const alertes = stats?.alertes_recentes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tableau de bord PUKRI</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Vue d'ensemble de la plateforme EduTrack</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Établissements" value={p?.totalEtablissements ?? '…'} icon={Building2} color="text-violet-400" />
        <StatCard label="Utilisateurs" value={p?.totalUtilisateurs ?? '…'} icon={Users} color="text-blue-400" />
        <StatCard label="Élèves" value={p?.totalEleves ?? '…'} icon={GraduationCap} color="text-emerald-400" />
        <StatCard label="Enseignants" value={p?.totalEnseignants ?? '…'} icon={UserCheck} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Parents" value={p?.totalParents ?? '…'} icon={Users} color="text-pink-400" />
        <StatCard label="Absences totales" value={p?.totalAbsences ?? '…'} icon={BookOpen} color="text-red-400" />
        <StatCard label="Bulletins publiés" value={p?.bulletinsPublies ?? '…'} icon={FileText} color="text-cyan-400" />
      </div>

      {/* Alertes récentes */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">Dernières erreurs système</h3>
          <a href="/pukri/alertes" className="ml-auto text-xs text-primary hover:underline">Voir tout →</a>
        </div>
        {alertes.length === 0 ? (
          <p className="text-sm text-emerald-400">✅ Aucune erreur récente. La plateforme fonctionne normalement.</p>
        ) : (
          <ul className="space-y-2">
            {alertes.map((a: any, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm py-2 border-b border-border last:border-0">
                <span className={cn('px-1.5 py-0.5 rounded text-xs font-mono font-bold shrink-0', a.status >= 500 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')}>
                  {a.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-mono text-xs truncate">{a.method} {a.path}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{a.message}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(a.ts, 'dd/MM HH:mm')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
