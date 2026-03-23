import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, supabaseEnvError } from '../../lib/supabaseClient'

export function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (supabaseEnvError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        {supabaseEnvError}
      </div>
    )
  }

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
