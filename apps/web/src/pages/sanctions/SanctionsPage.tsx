import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { sanctionsService } from '../../services/api/sanctions.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Btn, FormField, Input, Textarea } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import type { Sanction } from '../../types';

export default function SanctionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sanctions', { page }],
    queryFn: () => sanctionsService.findAll({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: sanctionsService.create,
    onSuccess: () => { toast.success('Sanction enregistrée'); qc.invalidateQueries({ queryKey: ['sanctions'] }); setModalOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: sanctionsService.remove,
    onSuccess: () => { toast.success('Sanction supprimée'); qc.invalidateQueries({ queryKey: ['sanctions'] }); setDeleteId(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const columns: Column<Sanction>[] = [
    { key: 'eleve', header: 'Élève', render: (s) => <span className="font-medium">{s.eleve.utilisateur.prenom} {s.eleve.utilisateur.nom}</span> },
    { key: 'classe', header: 'Classe', render: (s) => s.classe.libelle },
    { key: 'type', header: 'Type', render: (s) => <span className="capitalize">{s.type_sanction.replace(/_/g, ' ')}</span> },
    { key: 'date', header: 'Date', render: (s) => formatDate(s.date_sanction, 'dd/MM/yyyy') },
    { key: 'motif', header: 'Motif', render: (s) => <span className="text-muted-foreground truncate max-w-xs block">{s.motif}</span> },
    { key: 'auteur', header: 'Par', render: (s) => `${s.auteur.prenom} ${s.auteur.nom}` },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <Btn size="sm" variant="ghost" onClick={() => setDeleteId(s.id_sanction)}>
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </Btn>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sanctions"
        description={`${data?.meta.total ?? '…'} sanction(s)`}
        actions={<Btn onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Nouvelle</Btn>}
      />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        keyExtractor={(s) => s.id_sanction}
        emptyTitle="Aucune sanction"
      />

      <CreateSanctionModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} />
    </div>
  );
}

function CreateSanctionModal({ open, onClose, onSubmit, loading }: { open: boolean; onClose: () => void; onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ id_eleve: '', id_classe: '', type_sanction: 'avertissement', motif: '', date_sanction: new Date().toISOString().slice(0, 10), observations: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, id_eleve: parseInt(form.id_eleve), id_classe: parseInt(form.id_classe) });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle sanction" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="ID Élève" required><Input type="number" value={form.id_eleve} onChange={set('id_eleve')} required /></FormField>
          <FormField label="ID Classe" required><Input type="number" value={form.id_classe} onChange={set('id_classe')} required /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type de sanction">
            <Input value={form.type_sanction} onChange={set('type_sanction')} placeholder="avertissement, blâme…" />
          </FormField>
          <FormField label="Date" required><Input type="date" value={form.date_sanction} onChange={set('date_sanction')} required /></FormField>
        </div>
        <FormField label="Motif" required><Textarea value={form.motif} onChange={set('motif')} rows={2} required /></FormField>
        <FormField label="Observations"><Textarea value={form.observations} onChange={set('observations')} rows={2} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose} type="button">Annuler</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Enregistrement…' : 'Enregistrer'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
