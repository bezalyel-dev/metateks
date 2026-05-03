import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

export function TerminalGuard({ children }) {
  const authorized      = sessionStorage.getItem('teks_terminal_auth') === 'true'
  const alreadyLoggedIn = sessionStorage.getItem('teks_admin_session') === 'true'

  useEffect(() => {
    if (authorized) {
      sessionStorage.removeItem('teks_terminal_auth')
    }
  }, [])

  if (!authorized && !alreadyLoggedIn) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}