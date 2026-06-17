import { NavLink } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, School,
  ClipboardList, FileText, AlertCircle, Shield, Bell, BarChart3,
  CalendarDays, UserCheck, BookMarked, ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
  {
    label: 'Académique',
    items: [
      { to: '/eleves', icon: Users, label: 'Élèves', roles: ['administration', 'directeur', 'enseignant'] },
      { to: '/enseignants', icon: UserCheck, label: 'Enseignants', roles: ['administration', 'directeur'] },
      { to: '/classes', icon: School, label: 'Classes', roles: ['administration', 'directeur', 'enseignant'] },
      { to: '/matieres', icon: BookMarked, label: 'Matières', roles: ['administration', 'directeur'] },
    ],
  },
  {
    label: 'Pédagogie',
    items: [
      { to: '/evaluations', icon: ClipboardList, label: 'Évaluations & Notes', roles: ['administration', 'directeur', 'enseignant'] },
      { to: '/emplois-du-temps', icon: CalendarDays, label: 'Emploi du temps', roles: ['administration', 'directeur', 'enseignant'] },
    ],
  },
  {
    label: 'Vie scolaire',
    items: [
      { to: '/absences', icon: AlertCircle, label: 'Absences', roles: ['administration', 'directeur', 'enseignant'] },
      { to: '/sanctions', icon: Shield, label: 'Sanctions', roles: ['administration', 'directeur'] },
    ],
  },
  {
    label: 'Résultats',
    items: [
      { to: '/bulletins', icon: FileText, label: 'Bulletins' },
      { to: '/rapports-ia', icon: BarChart3, label: 'Rapports IA', roles: ['administration', 'directeur'] },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-30 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">EduTrack</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">PUKRI · Suivi scolaire</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.roles || (user && item.roles.includes(user.role)),
            );
            if (!visibleItems.length) return null;

            return (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1.5">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : '')} />
                            <span className="flex-1">{item.label}</span>
                            {isActive && <ChevronRight className="w-3 h-3 text-primary" />}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div className="px-3 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-muted">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">{user.prenom} {user.nom}</p>
                <p className="text-[10px] text-muted-foreground truncate capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
