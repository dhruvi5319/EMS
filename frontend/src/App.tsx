import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { AppShell } from './components/layout/AppShell';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { RequestListPage } from '@/pages/requests/RequestListPage';
import { RequestFormPage } from '@/pages/requests/RequestFormPage';
import { RequestDetailPage } from '@/pages/requests/RequestDetailPage';
import { ReviewQueuePage } from '@/pages/requests/ReviewQueuePage';

// ProtectedRoute — unauthenticated → /login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// PublicRoute — authenticated → /dashboard
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// RoleGuard — checks role requirement; renders ForbiddenPage if not authorized
export function RoleGuard({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuthContext();
  if (!user) return <Navigate to="/login" replace />;
  const hasRole = roles.some((r) => user.roles.includes(r));
  if (!hasRole) return <ForbiddenPage />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Authenticated shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Requests — AL, EM, RO, AD */}
        <Route
          path="/requests"
          element={
            <RoleGuard roles={['AL', 'EM', 'RO', 'AD']}>
              <RequestListPage />
            </RoleGuard>
          }
        />
        <Route
          path="/requests/new"
          element={
            <RoleGuard roles={['AL', 'AD']}>
              <RequestFormPage />
            </RoleGuard>
          }
        />
        <Route
          path="/requests/:id/edit"
          element={
            <RoleGuard roles={['AL', 'AD']}>
              <RequestFormPage />
            </RoleGuard>
          }
        />
        <Route
          path="/requests/:id"
          element={
            <RoleGuard roles={['AL', 'EM', 'RO', 'AD']}>
              <RequestDetailPage />
            </RoleGuard>
          }
        />

        {/* Engagements — ALL roles */}
        <Route
          path="/engagements"
          element={<div className="text-sm text-muted-foreground">Engagements — Phase 4</div>}
        />

        {/* Evidence — AN, EM, QA, IR, PC, AD */}
        <Route
          path="/evidence"
          element={
            <RoleGuard roles={['AN', 'EM', 'QA', 'IR', 'PC', 'AD']}>
              <div className="text-sm text-muted-foreground">Evidence — Phase 5</div>
            </RoleGuard>
          }
        />

        {/* Review Queue — AL, QA, IR, PC, AD */}
        <Route
          path="/review-queue"
          element={
            <RoleGuard roles={['AL', 'QA', 'IR', 'PC', 'AD']}>
              <ReviewQueuePage />
            </RoleGuard>
          }
        />

        {/* Reports — AL, EM, QA, PC, RO, AD */}
        <Route
          path="/reports"
          element={
            <RoleGuard roles={['AL', 'EM', 'QA', 'PC', 'RO', 'AD']}>
              <div className="text-sm text-muted-foreground">Reports — Phase 6</div>
            </RoleGuard>
          }
        />

        {/* Admin — AD only */}
        <Route
          path="/admin/users"
          element={
            <RoleGuard roles={['AD']}>
              <UserManagementPage />
            </RoleGuard>
          }
        />

        {/* Engagement audit trail — authenticated, engagements read by all roles */}
        <Route
          path="/engagements/:id/audit"
          element={<AuditTrailPage />}
        />

        {/* 403 direct route */}
        <Route path="/403" element={<ForbiddenPage />} />
      </Route>

      {/* Root + catch-all */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
