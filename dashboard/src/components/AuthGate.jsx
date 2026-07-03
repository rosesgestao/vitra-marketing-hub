import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { VitraHorizontalLogo } from './PremiumBrand.jsx'

// Gate de autenticacao (Supabase Auth). Endurecimento para o deploy PUBLICO (vitrapremium.com.br):
// sem login, nenhuma tela do app aparece — e as Edges de IA (verify_jwt=true + edgeAuth) so autorizam
// o JWT de um usuario autenticado. Assim a chave publishable (publica, no bundle) sozinha nao dispara
// chamada paga. Sessao persistida pelo supabase-js (localStorage) + refresh automatico.

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (authError) {
      setError(
        /invalid login/i.test(authError.message)
          ? 'E-mail ou senha incorretos.'
          : (authError.message || 'Nao foi possivel entrar. Tente novamente.'),
      )
    }
    // Sucesso: onAuthStateChange no AuthGate troca para o app automaticamente.
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-[#0A1628] px-4"
      style={{ backgroundImage: 'radial-gradient(60% 50% at 78% 8%, rgba(196,148,42,0.10), transparent 70%)' }}>
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <VitraHorizontalLogo className="h-9 w-auto" />
        </div>
        <form onSubmit={onSubmit}
          className="rounded-2xl border border-[#C4942A]/25 bg-[#0E1D38]/80 backdrop-blur px-7 py-8 shadow-[0_18px_50px_rgba(5,12,22,0.55)]">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#C4942A] uppercase">Operacao Imobiliaria</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-white">Entrar</h1>
          <p className="mt-1 text-sm text-white/55">Acesso restrito a equipe Vitra.</p>

          <label className="mt-6 block text-sm text-white/80" htmlFor="auth-email">E-mail</label>
          <input id="auth-email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/12 bg-[#0A1628] px-3.5 py-2.5 text-[15px] text-white outline-none transition focus:border-[#C4942A] focus:ring-2 focus:ring-[#C4942A]/30"
            placeholder="voce@vitra.com.br" />

          <label className="mt-4 block text-sm text-white/80" htmlFor="auth-password">Senha</label>
          <input id="auth-password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/12 bg-[#0A1628] px-3.5 py-2.5 text-[15px] text-white outline-none transition focus:border-[#C4942A] focus:ring-2 focus:ring-[#C4942A]/30"
            placeholder="••••••••" />

          {error ? (
            <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={busy || !email || !password}
            className="mt-6 w-full rounded-lg bg-[#C4942A] px-4 py-2.5 text-[15px] font-semibold text-[#0A1628] transition hover:bg-[#d4a84a] disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-white/35">
          Esqueceu a senha? Fale com o administrador para redefinir no painel.
        </p>
      </div>
    </div>
  )
}

function LogoutButton() {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      title="Sair da conta"
      onClick={async () => { setBusy(true); await supabase.auth.signOut() }}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0A1628]/85 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur transition hover:border-[#C4942A]/40 hover:text-white"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {busy ? 'Saindo…' : 'Sair'}
    </button>
  )
}

export default function AuthGate({ children }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'authed' | 'anon'

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setStatus(data?.session ? 'authed' : 'anon')
    }).catch(() => { if (active) setStatus('anon') })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'authed' : 'anon')
    })
    return () => { active = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-dvh w-full flex items-center justify-center bg-[#0A1628]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#C4942A]" aria-label="Carregando" />
      </div>
    )
  }

  if (status !== 'authed') return <LoginScreen />

  return (
    <>
      {children}
      <LogoutButton />
    </>
  )
}
