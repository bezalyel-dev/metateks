import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AdminLoginPage } from '../pages/AdminLoginPage'
import { AdminPanelPage } from '../pages/AdminPanelPage'
import { TvDashboardPage } from '../pages/TvDashboardPage'
import { WormholeEntry } from '../pages/WormholeEntry'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<WormholeEntry />} />
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
