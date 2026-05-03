import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { TerminalGuard } from '../components/auth/TerminalGuard'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { AdminLoginPage } from '../pages/AdminLoginPage'
import { AdminPanelPage } from '../pages/AdminPanelPage'
import { TvDashboardPage } from '../pages/TvDashboardPage'
import { WormholeEntry } from '../pages/WormholeEntry'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<WormholeEntry />} />
      <Route path="/tv" element={<TvDashboardPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route
        path="/admin/login"
        element={
          <TerminalGuard>
            <AdminLoginPage />
          </TerminalGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanelPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}