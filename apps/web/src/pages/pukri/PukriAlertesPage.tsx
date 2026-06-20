import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminService } from '../../services/api/super-admin.service';
import { PageHeader, Btn } from '../../components/ui/PageHeader';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

export default function PukriAlertesPage() {
  const qc = useQueryClient();

  const { data: alertes, isLoading } = useQuery({
    queryKey: ['pukri-alertes'],
    queryFn: superAdminService.getAlerts,
    refetchInterval: 30_000,
  });

  const clearMutation = useMutation({
    mutationFn: superAdminService.clearAlerts,
    onSuccess: () => { toast.success('Alertes effacées'); qc.invalidateQueries({ queryKey: ['pukri-alertes'] }); },
  });

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="Alertes système"
        description={`${alertes?.length ?? 0} erreur(s) enregistrée(s) (max 200)`}
        actions={
          alertes?.length ? (
            <Btn variant="danger" size="sm" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
              <Trash2 className="w-3.5 h-3.5" /> Effacer tout
            </Btn>
          ) : undefined
        }
      />

      {!alertes?.length ? (
        <div className="flex items-center gap-3 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-400">Aucune erreur — la plateforme fonctionne normalement.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alertes.map((a: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0 mt-0.5',
                  a.status >= 500 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400',
                )}>
                  {a.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-medium text-foreground">
                    <span className="text-muted-foreground mr-2">{a.method}</span>
                    {a.path}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(a.ts, 'dd/MM/yyyy HH:mm:ss')}</span>
                    {a.etablissementId && <span>Établissement #{a.etablissementId}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
