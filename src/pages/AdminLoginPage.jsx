import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseEnvError } from '../lib/supabaseClient'
import { fetchDashboardConfig } from '../lib/dashboardConfig'

export function AdminLoginPage() {
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [logoUrl,  setLogoUrl]  = useState(null)

  // Busca a logo de login salva no painel (best-effort, sem bloquear o form)
  useState(() => {
    if (!supabase) return
    fetchDashboardConfig(supabase)
      .then((cfg) => { if (cfg?.url_logo_login) setLogoUrl(cfg.url_logo_login) })
      .catch(() => {})
  })

  async function handleSubmit(e) {
    e.preventDefault()

    if (!supabase) {
      setError(supabaseEnvError)
      return
    }

    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    // Renova a flag para o TerminalGuard liberar /admin
    // e marca sessão ativa para permitir reload sem cair em /access-denied
    sessionStorage.setItem('teks_terminal_auth', 'true')
    sessionStorage.setItem('teks_admin_session', 'true')
    navigate('/admin')
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #030f07 0%, #061a0d 50%, #040d09 100%)',
      }}
    >
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 999px rgba(20, 50, 30, 0.95) inset !important;
          box-shadow: 0 0 0 999px rgba(20, 50, 30, 0.95) inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #4ade80 !important;
        }
      `}</style>
      {/* Glow de fundo */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 40%, rgba(34,197,94,0.10) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 50% 40% at 80% 70%, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl p-10 md:p-14 transition-all duration-500"
        style={{
          background: 'rgba(3, 18, 10, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(74,222,128,0.18)',
          boxShadow: '0 0 60px rgba(74,222,128,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 90px rgba(74,222,128,0.20), 0 0 180px rgba(74,222,128,0.08), inset 0 1px 0 rgba(255,255,255,0.07)'
          e.currentTarget.style.borderColor = 'rgba(74,222,128,0.38)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 60px rgba(74,222,128,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(74,222,128,0.18)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Glow interno */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: '#4ade80' }}
        />

        {/* Logo ou nome */}
        <div className="mb-10 flex flex-col items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-auto object-contain"
              style={{ maxHeight: 80, maxWidth: '60%' }}
            />
          ) : null}

          <p
            className="text-center font-black uppercase tracking-[0.4em]"
            style={{
              fontSize: 'clamp(18px, 2.5vw, 26px)',
              color: '#4ade80',
              textShadow: '0 0 20px rgba(74,222,128,0.5)',
            }}
          >
            Teks Software
          </p>

          <div
            className="h-px w-24"
            style={{ background: 'linear-gradient(90deg, transparent, #4ade80, transparent)' }}
          />

          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Painel administrativo
          </p>
        </div>

        {/* Formulário */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@teks.com.br"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(74,222,128,0.2)',
                color: '#ffffff',
                caretColor: '#4ade80',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(74,222,128,0.65)'
                e.target.style.background  = 'rgba(255,255,255,0.16)'
                e.target.style.boxShadow   = '0 0 12px rgba(74,222,128,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(74,222,128,0.2)'
                e.target.style.background  = 'rgba(255,255,255,0.12)'
                e.target.style.boxShadow   = 'none'
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(74,222,128,0.2)',
                color: '#ffffff',
                caretColor: '#4ade80',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(74,222,128,0.65)'
                e.target.style.background  = 'rgba(255,255,255,0.16)'
                e.target.style.boxShadow   = '0 0 12px rgba(74,222,128,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(74,222,128,0.2)'
                e.target.style.background  = 'rgba(255,255,255,0.12)'
                e.target.style.boxShadow   = 'none'
              }}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg px-4 py-2.5 text-sm font-medium text-red-400"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full rounded-xl py-3.5 font-bold tracking-wide transition-all duration-200"
          style={{
            background: loading ? 'rgba(74,222,128,0.3)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: loading ? 'rgba(255,255,255,0.5)' : '#fff',
            boxShadow: loading ? 'none' : '0 0 24px rgba(74,222,128,0.3)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (loading) return
            e.currentTarget.style.background  = 'linear-gradient(135deg, #4ade80, #22c55e)'
            e.currentTarget.style.boxShadow   = '0 0 40px rgba(74,222,128,0.5)'
            e.currentTarget.style.transform   = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            if (loading) return
            e.currentTarget.style.background  = 'linear-gradient(135deg, #22c55e, #16a34a)'
            e.currentTarget.style.boxShadow   = '0 0 24px rgba(74,222,128,0.3)'
            e.currentTarget.style.transform   = 'translateY(0)'
          }}
          onMouseDown={(e) => {
            if (loading) return
            e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
          }}
          onMouseUp={(e) => {
            if (loading) return
            e.currentTarget.style.transform = 'translateY(-1px) scale(1)'
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </main>
  )
}