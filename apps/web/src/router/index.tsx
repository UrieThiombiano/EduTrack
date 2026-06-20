import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuthStore } from '../store/auth.store';

// Auth
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// Établissement
const DashboardPage       = lazy(() => import('../pages/dashboard/DashboardPage'));
const ElevesListPage      = lazy(() => import('../pages/eleves/ElevesListPage'));
const EleveDetailPage     = lazy(() => import('../pages/eleves/EleveDetailPage'));
const EnseignantsPage     = lazy(() => import('../pages/enseignants/EnseignantsPage'));
const ClassesPage         = lazy(() => import('../pages/classes/ClassesPage'));
const EvaluationsPage     = lazy(() => import('../pages/evaluations/EvaluationsPage'));
const AbsencesPage        = lazy(() => import('../pages/absences/AbsencesPage'));
const SanctionsPage       = lazy(() => import('../pages/sanctions/SanctionsPage'));
const NotificationsPage   = lazy(() => import('../pages/notifications/NotificationsPage'));
const BulletinsPage       = lazy(() => import('../pages/bulletins/BulletinsPage'));
const RapportsIaPage      = lazy(() => import('../pages/rapports-ia/RapportsIaPage'));

// Parent
const ParentDashboardPage = lazy(() => import('../pages/parent/ParentDashboardPage'));

// PUKRI super-admin
const PukriDashboardPage        = lazy(() => import('../pages/pukri/PukriDashboardPage'));
const PukriEtablissementsPage   = lazy(() => import('../pages/pukri/PukriEtablissementsPage'));
const PukriAlertesPage          = lazy(() => import('../pages/pukri/PukriAlertesPage'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/** Redirige vers la page d'accueil appropriée selon le rôle */
function HomeRedirect() {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/pukri" replace />;
  if (user.role === 'parent')      return <Navigate to="/parent" replace />;
  return <Navigate to="/dashboard" replace />;
}

/** Bloque les rôles non autorisés sur une route */
function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Publique */}
        <Route path="/login" element={<LoginPage />} />

        {/* Toutes les routes protégées */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* ── Établissement : Administration + Directeur ─── */}
            <Route path="/dashboard" element={
              <RoleRoute roles={['administration', 'directeur', 'enseignant']}>
                <DashboardPage />
              </RoleRoute>
            } />

            {/* Gestion (admin + directeur seulement) */}
            <Route path="/eleves" element={
              <RoleRoute roles={['administration', 'directeur', 'enseignant']}>
                <ElevesListPage />
              </RoleRoute>
            } />
            <Route path="/eleves/:id" element={
              <RoleRoute roles={['administration', 'directeur', 'enseignant']}>
                <EleveDetailPage />
              </RoleRoute>
            } />
            <Route path="/enseignants" element={
              <RoleRoute roles={['administration', 'directeur']}>
                <EnseignantsPage />
              </RoleRoute>
            } />
            <Route path="/classes" element={
              <RoleRoute roles={['administration', 'directeur', 'enseignant']}>
                <ClassesPage />
              </RoleRoute>
            } />

            {/* Pédagogie (admin + directeur + enseignant) */}
            <Route path="/evaluations" element={
              <RoleRoute roles={['administration', 'directeur', 'enseignant']}>
                <EvaluationsPage />
              </RoleRoute>
            } />

            {/* Vie scolaire (admin + directeur + enseignant) */}
            <Route path="/absences" element={
              <RoleRoute roles={['administration', 'directeur', 'enseignant']}>
                <AbsencesPage />
              </RoleRoute>
            } />
            <Route path="/sanctions" element={
              <RoleRoute roles={['administration', 'directeur', 'enseignant']}>
                <SanctionsPage />
              </RoleRoute>
            } />

            {/* Bulletins (admin + directeur uniquement) */}
            <Route path="/bulletins" element={
              <RoleRoute roles={['administration', 'directeur']}>
                <BulletinsPage />
              </RoleRoute>
            } />
            <Route path="/rapports-ia" element={
              <RoleRoute roles={['administration', 'directeur']}>
                <RapportsIaPage />
              </RoleRoute>
            } />

            {/* Notifications (tous sauf super_admin) */}
            <Route path="/notifications" element={
              <RoleRoute roles={['administration', 'directeur', 'enseignant', 'parent']}>
                <NotificationsPage />
              </RoleRoute>
            } />

            {/* ── Espace parent ─────────────────────────────── */}
            <Route path="/parent" element={
              <RoleRoute roles={['parent']}>
                <ParentDashboardPage />
              </RoleRoute>
            } />

            {/* ── PUKRI super-admin ─────────────────────────── */}
            <Route path="/pukri" element={
              <RoleRoute roles={['super_admin']}>
                <PukriDashboardPage />
              </RoleRoute>
            } />
            <Route path="/pukri/etablissements" element={
              <RoleRoute roles={['super_admin']}>
                <PukriEtablissementsPage />
              </RoleRoute>
            } />
            <Route path="/pukri/alertes" element={
              <RoleRoute roles={['super_admin']}>
                <PukriAlertesPage />
              </RoleRoute>
            } />

          </Route>
        </Route>

        {/* Redirections */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
  );
}
