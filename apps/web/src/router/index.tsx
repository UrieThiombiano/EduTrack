import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Auth
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// Pages protégées
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ElevesListPage = lazy(() => import('../pages/eleves/ElevesListPage'));
const EleveDetailPage = lazy(() => import('../pages/eleves/EleveDetailPage'));
const EnseignantsPage = lazy(() => import('../pages/enseignants/EnseignantsPage'));
const ClassesPage = lazy(() => import('../pages/classes/ClassesPage'));
const EvaluationsPage = lazy(() => import('../pages/evaluations/EvaluationsPage'));
const AbsencesPage = lazy(() => import('../pages/absences/AbsencesPage'));
const SanctionsPage = lazy(() => import('../pages/sanctions/SanctionsPage'));
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const BulletinsPage = lazy(() => import('../pages/bulletins/BulletinsPage'));
const RapportsIaPage = lazy(() => import('../pages/rapports-ia/RapportsIaPage'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Publique */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protégées avec AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/eleves" element={<ElevesListPage />} />
            <Route path="/eleves/:id" element={<EleveDetailPage />} />
            <Route path="/enseignants" element={<EnseignantsPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/evaluations" element={<EvaluationsPage />} />
            <Route path="/absences" element={<AbsencesPage />} />
            <Route path="/sanctions" element={<SanctionsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/bulletins" element={<BulletinsPage />} />
            <Route path="/rapports-ia" element={<RapportsIaPage />} />
          </Route>
        </Route>

        {/* Redirections */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
