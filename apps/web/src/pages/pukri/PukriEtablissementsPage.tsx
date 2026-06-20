import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, PowerOff, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminService } from '../../services/api/super-admin.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Btn, FormField, Input, Select } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

export default function PukriEtablissementsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [desactiverId, setDesactiverId] = useState<number | null>(null);
  const [form, setForm] = useState({ nom: '', code_etablissement: '', email: '', telephone: '', ville: '', pays: 'Burkina Faso', type_etablissement: 'secondaire' });

  const { data, isLoading } = useQuery({
    queryKey: ['pukri-etablissements', page],
    queryFn: () => superAdminService.listEtablissements(page),
  });

  const createMutation = useMutation({
    mutationFn: () => superAdminService.createEtablissement(form as any),
    onSuccess: () => { toast.success('Établissement créé'); qc.invalidateQueries({ queryKey: ['pukri-etablissements'] }); setCreateModal(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const desactiverMutation = useMutation({
    mutationFn: (id: number) => superAdminService.desactiverEtablissement(id),
    onSuccess: () => { toast.success('Établissement désactivé'); qc.invalidateQueries({ queryKey: ['pukri-etablissements'] }); setDesactiverId(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => superAdminService.deleteEtablissement(id),
    onSuccess: () => { toast.success('Établissement supprimé'); qc.invalidateQueries({ queryKey: ['pukri-etablissements'] }); setDeleteId(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const columns: Column<any>[] = [
    {
      key: 'nom',
      header: 'Établissement',
      render: (e) => (
        <div>
          <p className="font-medium">{e.nom}</p>
          <p className="text-xs font-mono text-muted-foreground">{e.code_etablissement}</p>
        </div>
      ),
    },
    { key: 'ville', header: 'Localisation', render: (e) => `${e.ville ?? '—'}, ${e.pays}` },
    { key: 'type', header: 'Type', render: (e) => <Badge variant="info">{e.type_etablissement ?? '—'}</Badge> },
    { key: 'users', header: 'Utilisateurs', render: (e) => e._count?.utilisateurs ?? 0 },
    { key: 'created', header: 'Créé le', render: (e) => formatDate(e.date_creation, 'dd/MM/yyyy') },
    {
      key: 'statut',
      header: 'Statut',
      render: (e) => <Badge variant={e.est_actif ? 'success' : 'muted'}>{e.est_actif ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <div className="flex gap-1">
          {e.est_actif && (
            <Btn size="sm" variant="ghost" onClick={() => setDesactiverId(e.id_etablissement)} title="Désactiver">
              <PowerOff className="w-3.5 h-3.5 text-amber-400" />
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => setDeleteId(e.id_etablissement)} title="Supprimer">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Établissements clients"
        description={`${data?.meta?.total ?? '…'} établissement(s) sur la plateforme`}
        actions={<Btn onClick={() => setCreateModal(true)}><Plus className="w-4 h-4" /> Nouvel établissement</Btn>}
      />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        keyExtractor={(e: any) => e.id_etablissement}
        emptyTitle="Aucun établissement"
      />

      {/* Modal création */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Créer un établissement" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nom" required><Input value={form.nom} onChange={set('nom')} placeholder="Lycée Zinda…" /></FormField>
            <FormField label="Code unique" required><Input value={form.code_etablissement} onChange={set('code_etablissement')} placeholder="LYC-BF-002" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email"><Input type="email" value={form.email} onChange={set('email')} /></FormField>
            <FormField label="Téléphone"><Input value={form.telephone} onChange={set('telephone')} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ville"><Input value={form.ville} onChange={set('ville')} /></FormField>
            <FormField label="Pays">
              <Select value={form.pays} onChange={set('pays')}>
                <option>Burkina Faso</option>
                <option>Côte d'Ivoire</option>
                <option>Mali</option>
                <option>Sénégal</option>
                <option>Niger</option>
                <option>Bénin</option>
                <option>Togo</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Type">
            <Select value={form.type_etablissement} onChange={set('type_etablissement')}>
              <option value="secondaire">Secondaire</option>
              <option value="primaire">Primaire</option>
              <option value="superieur">Supérieur</option>
              <option value="professionnel">Professionnel</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setCreateModal(false)}>Annuler</Btn>
            <Btn onClick={() => createMutation.mutate()} disabled={!form.nom || !form.code_etablissement || createMutation.isPending}>
              {createMutation.isPending ? 'Création…' : 'Créer'}
            </Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={desactiverId !== null}
        onClose={() => setDesactiverId(null)}
        onConfirm={() => desactiverId !== null && desactiverMutation.mutate(desactiverId)}
        loading={desactiverMutation.isPending}
        title="Désactiver l'établissement"
        description="L'établissement et ses utilisateurs seront bloqués. Les données sont conservées."
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Supprimer l'établissement"
        description="Suppression définitive. Possible uniquement si aucun utilisateur n'est rattaché."
      />
    </div>
  );
}
