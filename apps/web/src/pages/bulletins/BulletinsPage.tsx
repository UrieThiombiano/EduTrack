import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, CheckCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { bulletinsService } from '../../services/api/bulletins.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Btn, FormField, Input, Select } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatNote } from '../../lib/utils';
import type { Bulletin } from '../../types';
import { useAuthStore } from '../../store/auth.store';

export default function BulletinsPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ est_publie: '' });
  const [genModal, setGenModal] = useState(false);
  const [classeId, setClasseId] = useState('');
  const [periodeId, setPeriodeId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bulletins', { page, ...filters }],
    queryFn: () => bulletinsService.findAll({ page, limit: 20, est_publie: filters.est_publie || undefined }),
  });

  const genererMutation = useMutation({
    mutationFn: () => bulletinsService.generer(parseInt(classeId), parseInt(periodeId)),
    onSuccess: (res: any) => {
      toast.success(`${res.count} bulletin(s) généré(s)`);
      qc.invalidateQueries({ queryKey: ['bulletins'] });
      setGenModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const publierMutation = useMutation({
    mutationFn: (id: number) => bulletinsService.publier(id),
    onSuccess: () => { toast.success('Bulletin publié — parents notifiés'); qc.invalidateQueries({ queryKey: ['bulletins'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const downloadPdf = async (id: number) => {
    const url = bulletinsService.downloadPdfUrl(id);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bulletin-${id}.pdf`;
    a.click();
  };

  const columns: Column<Bulletin>[] = [
    {
      key: 'eleve',
      header: 'Élève',
      render: (b) => <span className="font-medium">{b.eleve.utilisateur.prenom} {b.eleve.utilisateur.nom}</span>,
    },
    { key: 'classe', header: 'Classe', render: (b) => b.classe.libelle },
    { key: 'periode', header: 'Période', render: (b) => b.periode.libelle ?? b.periode.type_periode },
    {
      key: 'moy',
      header: 'Moy. gén.',
      render: (b) => {
        const m = b.moyenne_generale;
        const color = m !== null && m < 10 ? 'text-red-400' : m !== null && m >= 14 ? 'text-emerald-400' : 'text-foreground';
        return <span className={`font-bold ${color}`}>{formatNote(m)}</span>;
      },
    },
    { key: 'rang', header: 'Rang', render: (b) => b.rang ? `${b.rang}/${b.total_eleves_classe ?? '?'}` : '—' },
    {
      key: 'statut',
      header: 'Statut',
      render: (b) => <Badge variant={b.est_publie ? 'success' : 'muted'}>{b.est_publie ? 'Publié' : 'Brouillon'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (b) => (
        <div className="flex gap-1">
          {!b.est_publie && (
            <Btn size="sm" variant="ghost" onClick={() => publierMutation.mutate(b.id_bulletin)} title="Publier">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => downloadPdf(b.id_bulletin)} title="Télécharger PDF">
            <Download className="w-3.5 h-3.5 text-blue-400" />
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bulletins"
        description={`${data?.meta.total ?? '…'} bulletin(s)`}
        actions={
          <Btn onClick={() => setGenModal(true)}>
            <Zap className="w-4 h-4" /> Générer
          </Btn>
        }
      />

      <Select
        value={filters.est_publie}
        onChange={(e) => { setFilters((f) => ({ ...f, est_publie: e.target.value })); setPage(1); }}
        className="w-48"
      >
        <option value="">Tous les bulletins</option>
        <option value="false">Brouillons</option>
        <option value="true">Publiés</option>
      </Select>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        keyExtractor={(b) => b.id_bulletin}
        emptyTitle="Aucun bulletin"
        emptyDescription="Générez les bulletins depuis une classe et une période."
      />

      {/* Modal génération */}
      <Modal open={genModal} onClose={() => setGenModal(false)} title="Générer les bulletins" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Calcule automatiquement les moyennes pondérées et les rangs pour toute la classe.</p>
          <FormField label="ID Classe" required><Input type="number" value={classeId} onChange={(e) => setClasseId(e.target.value)} placeholder="ex : 3" /></FormField>
          <FormField label="ID Période" required><Input type="number" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} placeholder="ex : 1" /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setGenModal(false)}>Annuler</Btn>
            <Btn
              onClick={() => genererMutation.mutate()}
              disabled={!classeId || !periodeId || genererMutation.isPending}
            >
              {genererMutation.isPending ? 'Génération…' : 'Générer'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
