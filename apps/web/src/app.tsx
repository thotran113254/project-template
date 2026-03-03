import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ErrorBoundary } from "@/components/error-boundary";

// Auth pages — loaded eagerly so they feel instant
const LoginPage = lazy(() => import("@/pages/login-page"));
const RegisterPage = lazy(() => import("@/pages/register-page"));

// Protected pages — lazy loaded after auth resolves
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const ResourceListPage = lazy(() => import("@/pages/resource-list-page"));
const ResourceDetailPage = lazy(() => import("@/pages/resource-detail-page"));
const UsersPage = lazy(() => import("@/pages/users-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
    </div>
  );
}

/**
 * Root application component.
 * Public routes: /login, /register
 * Protected routes (require auth): /dashboard, /resources, /users
 */
export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — guarded by ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/resources" element={<ResourceListPage />} />
              <Route path="/resources/:id" element={<ResourceDetailPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
