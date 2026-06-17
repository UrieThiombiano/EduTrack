import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { elevesService } from '../../services/api/eleves.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Btn, FormField, Input, Select } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import type { Eleve } from '../../types';

export default function ElevesListPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['eleves', { page, search }],
    queryFn: () => elevesService.findAll({ page, limit: 20, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) => elevesService.create(dto),
    onSuccess: () => {
      toast.success('Élève créé avec succès');
      qc.invalidateQueries({ queryKey: ['eleves'] });
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur lors de la création'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => elevesService.remove(id),
    onSuccess: () => {
      toast.success('Élève désactivé');
      qc.invalidateQueries({ queryKey: ['eleves'] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const columns: Column<Eleve>[] = [
    {
      key: 'nom',
      header: 'Élève',
      render: (e) => (
        <div>
          <p className="font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</p>
          <p className="text-xs text-muted-foreground">{e.utilisateur.email ?? '—'}</p>
        </div>
      ),
    },
    { key: 'matricule', header: 'Matricule', render: (e) => <code className="text-xs">{e.matricule}</code> },
    { key: 'ddn', header: 'Né(e) le', render: (e) => e.date_naissance ? formatDate(e.date_naissance, 'dd/MM/yyyy') : '—' },
    { key: 'sexe', header: 'Sexe', render: (e) => e.sexe ?? '—' },
    {
      key: 'statut',
      header: 'Statut',
      render: (e) => <Badge variant={e.est_actif ? 'success' : 'muted'}>{e.est_actif ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <div className="flex items-center gap-1">
          <Btn size="sm" variant="ghost" onClick={() => navigate(`/eleves/${e.id_eleve}`)}>
            <Eye className="w-3.5 h-3.5" />
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Élèves"
        description={`${data?.meta.total ?? '…'} élève(s) enregistré(s)`}
        actions={
          <Btn onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Nouvel élève
          </Btn>
        }
      />

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher…"
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        keyExtractor={(e) => e.id_eleve}
        emptyTitle="Aucun élève"
        emptyDescription="Commencez par créer un élève."
      />

      {/* Modal création */}
      <CreateEleveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(dto) => createMutation.mutate(dto)}
        loading={createMutation.isPending}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        description="L'élève sera désactivé (soft delete). Ses données sont conservées."
      />
    </div>
  );
}

function CreateEleveModal({ open, onClose, onSubmit, loading }: { open: boolean; onClose: () => void; onSubmit: (d: Record<string, unknown>) => void; loading: boolean }) {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', matricule: '', sexe: 'M', password: '', date_naissance: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, dateNaissance: form.date_naissance || undefined });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvel élève" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Prénom" required><Input value={form.prenom} onChange={set('prenom')} required /></FormField>
          <FormField label="Nom" required><Input value={form.nom} onChange={set('nom')} required /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email"><Input type="email" value={form.email} onChange={set('email')} /></FormField>
          <FormField label="Matricule" required><Input value={form.matricule} onChange={set('matricule')} required /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date de naissance"><Input type="date" value={form.date_naissance} onChange={set('date_naissance')} /></FormField>
          <FormField label="Sexe">
            <Select value={form.sexe} onChange={set('sexe')}>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Mot de passe provisoire" required><Input type="password" value={form.password} onChange={set('password')} required /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose} type="button">Annuler</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Création…' : 'Créer l\'élève'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
