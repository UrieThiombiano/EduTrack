import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { rapportsIaService } from '../../services/api/rapports-ia.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Btn, FormField, Input } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import type { RapportIA } from '../../types';

const riskColors = { faible: 'success', moyen: 'warning', eleve: 'danger', critique: 'danger' } as const;

export default function RapportsIaPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [genModal, setGenModal] = useState(false);
  const [detailRapport, setDetailRapport] = useState<RapportIA | null>(null);
  const [eleveId, setEleveId] = useState('');
  const [periodeId, setPeriodeId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rapports-ia', { page }],
    queryFn: () => rapportsIaService.findAll({ page, limit: 20 }),
  });

  const genererMutation = useMutation({
    mutationFn: () => rapportsIaService.generer(parseInt(eleveId), parseInt(periodeId)),
    onSuccess: (res: any) => {
      toast.success('Rapport IA généré');
      qc.invalidateQueries({ queryKey: ['rapports-ia'] });
      setGenModal(false);
      setDetailRapport(res.rapport);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur API Anthropic'),
  });

  const columns: Column<RapportIA>[] = [
    { key: 'eleve', header: 'Élève', render: (r) => <span className="font-medium">{r.eleve.utilisateur.prenom} {r.eleve.utilisateur.nom}</span> },
    { key: 'periode', header: 'Période', render: (r) => r.periode.libelle ?? '—' },
    { key: 'score', header: 'Score risque', render: (r) => r.score_risque !== null ? `${Number(r.score_risque).toFixed(0)}/100` : '—' },
    {
      key: 'risque',
      header: 'Niveau',
      render: (r) => r.niveau_risque
        ? <Badge variant={riskColors[r.niveau_risque] ?? 'muted'}>{r.niveau_risque}</Badge>
        : <span className="text-muted-foreground">—</span>,
    },
    { key: 'modele', header: 'Modèle', render: (r) => <code className="text-xs">{r.version_modele ?? '—'}</code> },
    { key: 'date', header: 'Généré le', render: (r) => formatDate(r.date_generation, 'dd/MM/yyyy') },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Btn size="sm" variant="ghost" onClick={() => setDetailRapport(r)}>
          <BarChart3 className="w-3.5 h-3.5" /> Voir
        </Btn>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rapports IA"
        description="Analyses de trajectoires scolaires générées par Claude"
        actions={
          <Btn onClick={() => setGenModal(true)}>
            <Zap className="w-4 h-4" /> Générer un rapport
          </Btn>
        }
      />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        keyExtractor={(r) => r.id_rapport_ia}
        emptyTitle="Aucun rapport IA"
        emptyDescription="Publiez d'abord un bulletin, puis générez un rapport IA."
      />

      {/* Modal génération */}
      <Modal open={genModal} onClose={() => setGenModal(false)} title="Générer un rapport IA" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Le bulletin de l'élève doit être publié avant de générer le rapport.</p>
          <FormField label="ID Élève" required><Input type="number" value={eleveId} onChange={(e) => setEleveId(e.target.value)} /></FormField>
          <FormField label="ID Période" required><Input type="number" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setGenModal(false)}>Annuler</Btn>
            <Btn onClick={() => genererMutation.mutate()} disabled={!eleveId || !periodeId || genererMutation.isPending}>
              {genererMutation.isPending ? 'Analyse en cours…' : 'Générer'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Modal détail rapport */}
      {detailRapport && (
        <Modal open={!!detailRapport} onClose={() => setDetailRapport(null)} title="Rapport IA" size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold">{detailRapport.eleve.utilisateur.prenom} {detailRapport.eleve.utilisateur.nom}</p>
                <p className="text-sm text-muted-foreground">{detailRapport.periode.libelle}</p>
              </div>
              {detailRapport.niveau_risque && (
                <Badge variant={riskColors[detailRapport.niveau_risque] ?? 'muted'} className="ml-auto">
                  Risque {detailRapport.niveau_risque} — {Number(detailRapport.score_risque).toFixed(0)}/100
                </Badge>
              )}
            </div>

            {/* Score bar */}
            {detailRapport.score_risque !== null && (
              <div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${detailRapport.score_risque}%`,
                      background: Number(detailRapport.score_risque) < 25 ? '#10b981' : Number(detailRapport.score_risque) < 50 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {detailRapport.forces?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-2">✅ Forces</p>
                  <ul className="space-y-1">{detailRapport.forces.map((f, i) => <li key={i} className="text-sm text-muted-foreground">· {f}</li>)}</ul>
                </div>
              )}
              {detailRapport.faiblesses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-2">⚠️ Faiblesses</p>
                  <ul className="space-y-1">{detailRapport.faiblesses.map((f, i) => <li key={i} className="text-sm text-muted-foreground">· {f}</li>)}</ul>
                </div>
              )}
            </div>

            {detailRapport.recommandations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-400 mb-2">💡 Recommandations</p>
                <ul className="space-y-1">{detailRapport.recommandations.map((r, i) => <li key={i} className="text-sm text-muted-foreground">· {r}</li>)}</ul>
              </div>
            )}

            {detailRapport.evolution_recente && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-semibold mb-1">Évolution récente — <span className="capitalize">{detailRapport.evolution_recente.tendance}</span></p>
                <p className="text-sm text-muted-foreground">{detailRapport.evolution_recente.commentaire}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
