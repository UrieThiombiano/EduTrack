import { NavLink } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, Users, School, ClipboardList,
  FileText, AlertCircle, Shield, Bell, BarChart3, CalendarDays,
  UserCheck, BookMarked, ChevronRight, Globe, AlertTriangle, Building2,
  Heart,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface NavItem { to: string; icon: React.ElementType; label: string }
type NavGroup = { label: string; items: NavItem[] };

// Navigation par rôle
const navByRole: Record<string, NavGroup[]> = {
  super_admin: [
    {
      label: 'PUKRI Platform',
      items: [
        { to: '/pukri', icon: LayoutDashboard, label: 'Tableau de bord' },
        { to: '/pukri/etablissements', icon: Building2, label: 'Établissements' },
        { to: '/pukri/alertes', icon: AlertTriangle, label: 'Alertes système' },
      ],
    },
  ],
  administration: [
    {
      label: 'Principal',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
      ],
    },
    {
      label: 'Gestion',
      items: [
        { to: '/eleves', icon: Users, label: 'Élèves' },
        { to: '/enseignants', icon: UserCheck, label: 'Enseignants' },
        { to: '/classes', icon: School, label: 'Classes' },
        { to: '/matieres', icon: BookMarked, label: 'Matières' },
      ],
    },
    {
      label: 'Pédagogie',
      items: [
        { to: '/evaluations', icon: ClipboardList, label: 'Évaluations & Notes' },
        { to: '/emplois-du-temps', icon: CalendarDays, label: 'Emploi du temps' },
      ],
    },
    {
      label: 'Vie scolaire',
      items: [
        { to: '/absences', icon: AlertCircle, label: 'Absences' },
        { to: '/sanctions', icon: Shield, label: 'Sanctions' },
      ],
    },
    {
      label: 'Résultats',
      items: [
        { to: '/bulletins', icon: FileText, label: 'Bulletins' },
        { to: '/rapports-ia', icon: BarChart3, label: 'Rapports IA' },
      ],
    },
  ],
  directeur: [], // identique à administration, défini ci-dessous
  enseignant: [
    {
      label: 'Principal',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
      ],
    },
    {
      label: 'Mes classes',
      items: [
        { to: '/classes', icon: School, label: 'Mes classes' },
        { to: '/eleves', icon: Users, label: 'Mes élèves' },
        { to: '/evaluations', icon: ClipboardList, label: 'Évaluations & Notes' },
        { to: '/emplois-du-temps', icon: CalendarDays, label: 'Emploi du temps' },
      ],
    },
    {
      label: 'Vie scolaire',
      items: [
        { to: '/absences', icon: AlertCircle, label: 'Déclarer absence' },
        { to: '/sanctions', icon: Shield, label: 'Sanctions' },
      ],
    },
  ],
  parent: [
    {
      label: 'Mon espace',
      items: [
        { to: '/parent', icon: Heart, label: 'Mes enfants' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
      ],
    },
  ],
};
// Directeur = même que administration
navByRole.directeur = navByRole.administration;

interface SidebarProps { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const groups: NavGroup[] = navByRole[user?.role ?? ''] ?? [];
  const isPukri = user?.role === 'super_admin';

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed left-0 top-0 h-full z-30 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isPukri ? 'bg-violet-500/20' : 'bg-primary/10')}>
            {isPukri ? <Globe className="w-5 h-5 text-violet-400" /> : <GraduationCap className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">{isPukri ? 'PUKRI Admin' : 'EduTrack'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{isPukri ? 'Gestion plateforme' : 'PUKRI · Suivi scolaire'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1.5">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/pukri' || item.to === '/dashboard' || item.to === '/parent'}
                      onClick={onClose}
                      className={({ isActive }) => cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? isPukri ? 'bg-violet-500/10 text-violet-400 font-medium' : 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={cn('w-4 h-4 shrink-0', isActive ? (isPukri ? 'text-violet-400' : 'text-primary') : '')} />
                          <span className="flex-1">{item.label}</span>
                          {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        {user && (
          <div className="px-3 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-muted">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', isPukri ? 'bg-violet-500/20 text-violet-400' : 'bg-primary/20 text-primary')}>
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">{user.prenom} {user.nom}</p>
                <p className="text-[10px] text-muted-foreground truncate capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
