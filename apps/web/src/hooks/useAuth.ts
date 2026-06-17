import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const hasRole = (...roles: string[]) => !!user && roles.includes(user.role);

  const isAdmin = hasRole('administration', 'directeur');
  const isEnseignant = hasRole('enseignant');
  const isParent = hasRole('parent');
  const isEleve = hasRole('eleve');

  return { user, logout, isAuthenticated, hasRole, isAdmin, isEnseignant, isParent, isEleve };
}
