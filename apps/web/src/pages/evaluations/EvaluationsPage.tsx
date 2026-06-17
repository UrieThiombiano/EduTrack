import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { evaluationsService } from '../../services/api/evaluations.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Btn } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatNote } from '../../lib/utils';
import type { Evaluation, Note } from '../../types';

const statutVariant = (s: string) => {
  if (s === 'publie') return 'success';
  if (s === 'archive') return 'muted';
  return 'warning';
};

export default function EvaluationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [notesModal, setNotesModal] = useState<Evaluation | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['evaluations', { page }],
    queryFn: () => evaluationsService.findAll({ page, limit: 20 }),
  });

  const { data: notesData } = useQuery({
    queryKey: ['notes', notesModal?.id_evaluation],
    queryFn: () => notesModal ? evaluationsService.getNotes(notesModal.id_evaluation) : null,
    enabled: !!notesModal,
  });

  const deleteMutation = useMutation({
    mutationFn: evaluationsService.remove,
    onSuccess: () => { toast.success('Évaluation supprimée'); qc.invalidateQueries({ queryKey: ['evaluations'] }); setDeleteId(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
  });

  const columns: Column<Evaluation>[] = [
    {
      key: 'intitule',
      header: 'Évaluation',
      render: (e) => (
        <div>
          <p className="font-medium">{e.intitule ?? `Éval. #${e.id_evaluation}`}</p>
          <p className="text-xs text-muted-foreground">{e.type_evaluation?.libelle}</p>
        </div>
      ),
    },
    { key: 'matiere', header: 'Matière', render: (e) => e.attribution?.matiere?.libelle ?? '—' },
    { key: 'classe', header: 'Classe', render: (e) => e.attribution?.classe?.libelle ?? '—' },
    { key: 'date', header: 'Date', render: (e) => e.date_evaluation ? formatDate(e.date_evaluation, 'dd/MM/yyyy') : '—' },
    { key: 'max', header: '/20', render: (e) => e.note_maximale },
    { key: 'statut', header: 'Statut', render: (e) => <Badge variant={statutVariant(e.statut)}>{e.statut}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <div className="flex gap-1">
          <Btn size="sm" variant="ghost" onClick={() => setNotesModal(e)} title="Voir les notes">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          </Btn>
          {e.statut === 'brouillon' && (
            <Btn size="sm" variant="ghost" onClick={() => setDeleteId(e.id_evaluation)}>
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Évaluations & Notes" description={`${data?.meta.total ?? '…'} évaluation(s)`} />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        keyExtractor={(e) => e.id_evaluation}
        emptyTitle="Aucune évaluation"
        emptyDescription="Les évaluations sont créées depuis l'onglet Attributions."
      />

      {/* Modal notes */}
      <Modal open={!!notesModal} onClose={() => setNotesModal(null)} title={`Notes — ${notesModal?.intitule ?? ''}`} size="lg">
        {notesData && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Min : <strong>{formatNote(notesData.stats as any)}</strong></span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-xs uppercase">Élève</th>
                    <th className="px-4 py-2 text-center font-semibold text-xs uppercase">Note</th>
                    <th className="px-4 py-2 text-center font-semibold text-xs uppercase">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {notesData.notes.map((n: Note) => (
                    <tr key={n.id_note} className="hover:bg-muted/50">
                      <td className="px-4 py-2">{n.eleve.utilisateur.prenom} {n.eleve.utilisateur.nom}</td>
                      <td className="px-4 py-2 text-center font-medium">{n.valeur_note !== null ? Number(n.valeur_note).toFixed(2) : '—'}</td>
                      <td className="px-4 py-2 text-center">
                        {n.est_absent ? <Badge variant="danger">Abs.</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} />
    </div>
  );
}
