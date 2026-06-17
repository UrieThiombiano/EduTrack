import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/eleves': 'Élèves',
  '/enseignants': 'Enseignants',
  '/classes': 'Classes',
  '/matieres': 'Matières',
  '/evaluations': 'Évaluations & Notes',
  '/absences': 'Absences',
  '/sanctions': 'Sanctions',
  '/notifications': 'Notifications',
  '/bulletins': 'Bulletins',
  '/rapports-ia': 'Rapports IA',
  '/emplois-du-temps': 'Emploi du temps',
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const title = routeTitles[pathname] ?? routeTitles[Object.keys(routeTitles).find((k) => pathname.startsWith(k) && k !== '/') ?? ''];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
