import { Users, School, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { elevesService } from '../../services/api/eleves.service';
import { classesService } from '../../services/api/classes.service';
import { absencesService } from '../../services/api/absences.service';
import { bulletinsService } from '../../services/api/bulletins.service';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../lib/utils';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        </div>
        <div className={`p-2.5 rounded-lg bg-muted ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: elevesData } = useQuery({ queryKey: ['eleves', { limit: 1 }], queryFn: () => elevesService.findAll({ limit: 1 }) });
  const { data: classesData } = useQuery({ queryKey: ['classes', { limit: 1 }], queryFn: () => classesService.findAll({ limit: 1 }) });
  const { data: absencesToday } = useQuery({
    queryKey: ['absences-today'],
    queryFn: () => absencesService.findAll({
      date_debut: new Date().toISOString().slice(0, 10),
      date_fin: new Date().toISOString().slice(0, 10),
      limit: 1,
    }),
  });
  const { data: bulletinsData } = useQuery({
    queryKey: ['bulletins-publie'],
    queryFn: () => bulletinsService.findAll({ est_publie: 'true', limit: 1 }),
  });
  const { data: recentAbsences } = useQuery({
    queryKey: ['absences-recent'],
    queryFn: () => absencesService.findAll({ limit: 5 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Bonjour, {user?.prenom} 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{formatDate(new Date())} · Tableau de bord</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Élèves actifs" value={elevesData?.meta.total ?? '…'} icon={Users} color="text-blue-400" />
        <StatCard label="Classes" value={classesData?.meta.total ?? '…'} icon={School} color="text-emerald-400" />
        <StatCard label="Absences du jour" value={absencesToday?.meta.total ?? '…'} icon={AlertCircle} color="text-amber-400" />
        <StatCard label="Bulletins publiés" value={bulletinsData?.meta.total ?? '…'} icon={FileText} color="text-violet-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">Dernières absences</h3>
          </div>
          {recentAbsences?.data.length ? (
            <ul className="space-y-2">
              {recentAbsences.data.map((a) => (
                <li key={a.id_absence} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{a.eleve.utilisateur.prenom} {a.eleve.utilisateur.nom}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${a.type_absence === 'retard' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                      {a.type_absence}
                    </span>
                    <span className="text-muted-foreground text-xs">{formatDate(a.date_absence, 'dd/MM')}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune absence récente.</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Accès rapides</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Déclarer une absence', href: '/absences', border: 'border-amber-500/30 hover:border-amber-500' },
              { label: 'Saisir des notes', href: '/evaluations', border: 'border-blue-500/30 hover:border-blue-500' },
              { label: 'Générer bulletins', href: '/bulletins', border: 'border-violet-500/30 hover:border-violet-500' },
              { label: 'Rapport IA', href: '/rapports-ia', border: 'border-emerald-500/30 hover:border-emerald-500' },
            ].map((item) => (
              <a key={item.href} href={item.href} className={`border rounded-lg p-3 text-xs font-medium text-foreground transition ${item.border} hover:bg-muted`}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
