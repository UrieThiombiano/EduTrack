import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { notificationsService } from '../../services/api/notifications.service';
import { PageHeader, Btn } from '../../components/ui/PageHeader';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { Notification } from '../../types';

const typeLabels: Record<string, string> = {
  absence: '🔔 Absence',
  bulletin: '📋 Bulletin',
  note: '📝 Note',
  sanction: '⚠️ Sanction',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [nonLuesOnly, setNonLuesOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { page, non_lues: nonLuesOnly }],
    queryFn: () => notificationsService.findAll({ page, limit: 20, non_lues: nonLuesOnly ? 'true' : undefined }),
  });

  const marquerLuMutation = useMutation({
    mutationFn: notificationsService.marquerLu,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const marquerToutLuMutation = useMutation({
    mutationFn: notificationsService.marquerToutLu,
    onSuccess: () => {
      toast.success('Toutes les notifications marquées comme lues');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  if (isLoading) return <FullPageSpinner />;

  const notifications = data?.data ?? [];
  const nonLues = (data as any)?.non_lues ?? 0;

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Notifications"
        description={nonLues > 0 ? `${nonLues} non lue(s)` : 'Tout est lu'}
        actions={
          nonLues > 0 ? (
            <Btn variant="secondary" size="sm" onClick={() => marquerToutLuMutation.mutate()} disabled={marquerToutLuMutation.isPending}>
              <CheckCheck className="w-3.5 h-3.5" /> Tout marquer lu
            </Btn>
          ) : undefined
        }
      />

      {/* Filtre */}
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={nonLuesOnly}
          onChange={(e) => { setNonLuesOnly(e.target.checked); setPage(1); }}
          className="rounded"
        />
        Non lues uniquement
      </label>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Aucune notification" description="Vous êtes à jour !" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: Notification) => (
            <div
              key={n.id_notification}
              className={cn(
                'bg-card border rounded-xl p-4 flex items-start gap-3 transition',
                !n.est_lu ? 'border-primary/30 bg-primary/5' : 'border-border',
              )}
            >
              <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', !n.est_lu ? 'bg-primary' : 'bg-transparent')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {typeLabels[n.type_notification] ?? n.type_notification}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatDate(n.date_creation, 'dd/MM/yyyy HH:mm')}</span>
                </div>
                {n.titre && <p className="text-sm font-semibold text-foreground">{n.titre}</p>}
                <p className="text-sm text-muted-foreground mt-0.5">{n.contenu}</p>
              </div>
              {!n.est_lu && (
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => marquerLuMutation.mutate(n.id_notification)}
                  title="Marquer comme lu"
                >
                  <Check className="w-3.5 h-3.5" />
                </Btn>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination simple */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Précédent</Btn>
          <span className="text-sm text-muted-foreground py-1.5">Page {page}/{data.meta.totalPages}</span>
          <Btn variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages}>Suivant</Btn>
        </div>
      )}
    </div>
  );
}
