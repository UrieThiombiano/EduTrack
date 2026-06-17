import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { absencesService } from '../../services/api/absences.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Btn, FormField, Input, Select, Textarea } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import type { Absence } from '../../types';

export default function AbsencesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type_absence: '', est_justifie: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [justifyModal, setJustifyModal] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [motif, setMotif] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['absences', { page, ...filters }],
    queryFn: () => absencesService.findAll({
      page,
      limit: 20,
      type_absence: filters.type_absence || undefined,
      est_justifie: filters.est_justifie || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: absencesService.create,
    onSuccess: () => { toast.success('Absence déclarée'); qc.invalidateQueries({ queryKey: ['absences'] }); setModalOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const justifyMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => absencesService.justifier(id, motif),
    onSuccess: () => { toast.success('Absence justifiée'); qc.invalidateQueries({ queryKey: ['absences'] }); setJustifyModal(null); setMotif(''); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: absencesService.remove,
    onSuccess: () => { toast.success('Absence supprimée'); qc.invalidateQueries({ queryKey: ['absences'] }); setDeleteId(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const columns: Column<Absence>[] = [
    {
      key: 'eleve',
      header: 'Élève',
      render: (a) => <span className="font-medium">{a.eleve.utilisateur.prenom} {a.eleve.utilisateur.nom}</span>,
    },
    { key: 'classe', header: 'Classe', render: (a) => a.classe.libelle },
    { key: 'matiere', header: 'Matière', render: (a) => a.emploi_du_temps?.attribution?.matiere?.libelle ?? '—' },
    { key: 'date', header: 'Date', render: (a) => formatDate(a.date_absence, 'dd/MM/yyyy') },
    {
      key: 'type',
      header: 'Type',
      render: (a) => <Badge variant={a.type_absence === 'retard' ? 'warning' : 'danger'}>{a.type_absence}</Badge>,
    },
    {
      key: 'justif',
      header: 'Justification',
      render: (a) => a.est_justifie
        ? <Badge variant="success">Justifiée</Badge>
        : <Badge variant="muted">Non justifiée</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <div className="flex gap-1">
          {!a.est_justifie && (
            <Btn size="sm" variant="ghost" onClick={() => setJustifyModal(a.id_absence)} title="Justifier">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => setDeleteId(a.id_absence)} title="Supprimer">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Absences"
        description={`${data?.meta.total ?? '…'} absence(s)`}
        actions={<Btn onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Déclarer</Btn>}
      />

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <Select
          value={filters.type_absence}
          onChange={(e) => { setFilters((f) => ({ ...f, type_absence: e.target.value })); setPage(1); }}
          className="w-40"
        >
          <option value="">Tous types</option>
          <option value="absence">Absence</option>
          <option value="retard">Retard</option>
        </Select>
        <Select
          value={filters.est_justifie}
          onChange={(e) => { setFilters((f) => ({ ...f, est_justifie: e.target.value })); setPage(1); }}
          className="w-48"
        >
          <option value="">Toutes</option>
          <option value="false">Non justifiées</option>
          <option value="true">Justifiées</option>
        </Select>
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        keyExtractor={(a) => a.id_absence}
        emptyTitle="Aucune absence"
      />

      <DeclareAbsenceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={createMutation.mutate}
        loading={createMutation.isPending}
      />

      {/* Modal justification */}
      <Modal open={justifyModal !== null} onClose={() => { setJustifyModal(null); setMotif(''); }} title="Justifier l'absence" size="sm">
        <div className="space-y-4">
          <FormField label="Motif de justification">
            <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={3} placeholder="Maladie, convocation…" />
          </FormField>
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setJustifyModal(null)}>Annuler</Btn>
            <Btn onClick={() => justifyModal !== null && justifyMutation.mutate({ id: justifyModal, motif })} disabled={!motif || justifyMutation.isPending}>
              {justifyMutation.isPending ? 'Enregistrement…' : 'Justifier'}
            </Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function DeclareAbsenceModal({ open, onClose, onSubmit, loading }: { open: boolean; onClose: () => void; onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ id_eleve: '', id_emploi_du_temps: '', id_classe: '', type_absence: 'absence', date_absence: new Date().toISOString().slice(0, 10), heure_absence: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id_eleve: parseInt(form.id_eleve),
      id_emploi_du_temps: parseInt(form.id_emploi_du_temps),
      id_classe: parseInt(form.id_classe),
      type_absence: form.type_absence,
      date_absence: form.date_absence,
      heure_absence: form.heure_absence || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Déclarer une absence">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="ID Élève" required><Input type="number" value={form.id_eleve} onChange={set('id_eleve')} required /></FormField>
          <FormField label="ID Classe" required><Input type="number" value={form.id_classe} onChange={set('id_classe')} required /></FormField>
        </div>
        <FormField label="ID Emploi du temps" required><Input type="number" value={form.id_emploi_du_temps} onChange={set('id_emploi_du_temps')} required /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type">
            <Select value={form.type_absence} onChange={set('type_absence')}>
              <option value="absence">Absence</option>
              <option value="retard">Retard</option>
            </Select>
          </FormField>
          <FormField label="Date" required><Input type="date" value={form.date_absence} onChange={set('date_absence')} required /></FormField>
        </div>
        <FormField label="Heure (optionnel)"><Input type="time" value={form.heure_absence} onChange={set('heure_absence')} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose} type="button">Annuler</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Déclaration…' : 'Déclarer'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
