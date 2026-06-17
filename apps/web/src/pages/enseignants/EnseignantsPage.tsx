import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { enseignantsService } from '../../services/api/enseignants.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import type { Enseignant } from '../../types';

export default function EnseignantsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['enseignants', { page, search }],
    queryFn: () => enseignantsService.findAll({ page, limit: 20, search: search || undefined }),
  });

  const columns: Column<Enseignant>[] = [
    {
      key: 'nom',
      header: 'Enseignant',
      render: (e) => (
        <div>
          <p className="font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</p>
          <p className="text-xs text-muted-foreground">{e.utilisateur.email ?? '—'}</p>
        </div>
      ),
    },
    { key: 'matricule', header: 'Matricule', render: (e) => <code className="text-xs">{e.matricule}</code> },
    { key: 'specialite', header: 'Spécialité', render: (e) => e.specialite ?? '—' },
    { key: 'grade', header: 'Grade', render: (e) => e.grade ?? '—' },
    {
      key: 'statut',
      header: 'Statut',
      render: (e) => <Badge variant={e.est_actif ? 'success' : 'muted'}>{e.est_actif ? 'Actif' : 'Inactif'}</Badge>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Enseignants" description={`${data?.meta.total ?? '…'} enseignant(s)`} />

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
        keyExtractor={(e) => e.id_enseignant}
        emptyTitle="Aucun enseignant"
      />
    </div>
  );
}
