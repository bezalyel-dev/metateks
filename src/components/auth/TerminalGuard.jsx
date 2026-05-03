import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

export function TerminalGuard({ children }) {
  const authorized = sessionStorage.getItem('teks_terminal_auth') === 'true'

  // Remove a flag após a montagem — evita race condition com StrictMode
  // e garante que o acesso direto à URL seja bloqueado na próxima tentativa
  useEffect(() => {
    if (authorized) {
      sessionStorage.removeItem('teks_terminal_auth')
    }
  }, [])

  if (!authorized) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}