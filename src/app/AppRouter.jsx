import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AdminLoginPage } from '../pages/AdminLoginPage'
import { AdminPanelPage } from '../pages/AdminPanelPage'
import { TvDashboardPage } from '../pages/TvDashboardPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tv" replace />} />
      <Route path="/tv" element={<TvDashboardPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
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
