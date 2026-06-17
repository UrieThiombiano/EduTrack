import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { School, Search } from 'lucide-react';
import { classesService } from '../../services/api/classes.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import type { Classe } from '../../types';

export default function ClassesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['classes', { page, search }],
    queryFn: () => classesService.findAll({ page, limit: 20, search: search || undefined }),
  });

  const columns: Column<Classe>[] = [
    {
      key: 'libelle',
      header: 'Classe',
      render: (c) => (
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{c.libelle}</p>
            <p className="text-xs text-muted-foreground">{c.code_classe}</p>
          </div>
        </div>
      ),
    },
    { key: 'niveau', header: 'Niveau', render: (c) => c.niveau?.libelle ?? '—' },
    { key: 'annee', header: 'Année', render: (c) => c.annee_scolaire?.libelle ?? '—' },
    { key: 'effectif', header: 'Effectif', render: (c) => c._count?.inscriptions ?? '—' },
    {
      key: 'statut',
      header: 'Statut',
      render: (c) => <Badge variant={c.est_actif ? 'success' : 'muted'}>{c.est_actif ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Classes" description={`${data?.meta.total ?? '…'} classe(s)`} />

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
        keyExtractor={(c) => c.id_classe}
        emptyTitle="Aucune classe"
      />
    </div>
  );
}
