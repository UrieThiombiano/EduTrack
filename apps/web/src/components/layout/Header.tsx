import { Menu, Bell, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '../../services/api/notifications.service';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout } = useAuth();

  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsService.countNonLues(),
    refetchInterval: 30_000,
  });

  const nonLues = countData?.count ?? 0;

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg hover:bg-muted transition lg:hidden"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        {title && (
          <h2 className="text-sm font-semibold text-foreground hidden sm:block">{title}</h2>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <a
          href="/notifications"
          className={cn(
            'relative p-1.5 rounded-lg hover:bg-muted transition',
            nonLues > 0 && 'text-primary',
          )}
        >
          <Bell className="w-5 h-5" />
          {nonLues > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {nonLues > 9 ? '9+' : nonLues}
            </span>
          )}
        </a>

        {/* Avatar + logout */}
        {user && (
          <div className="flex items-center gap-2 ml-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user.prenom[0]}{user.nom[0]}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user.prenom} {user.nom}
            </span>
            <button
              onClick={logout}
              title="Déconnexion"
              className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
