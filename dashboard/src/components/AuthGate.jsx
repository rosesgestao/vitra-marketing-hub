import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { VitraHorizontalLogo } from './PremiumBrand.jsx'

// Gate de autenticacao (Supabase Auth). Endurecimento para o deploy PUBLICO (vitrapremium.com.br):
// sem login, nenhuma tela do app aparece — e as Edges de IA (verify_jwt=true + edgeAuth) so autorizam
// o JWT de um usuario autenticado. Assim a chave publishable (publica, no bundle) sozinha nao dispara
// chamada paga. Sessao persistida pelo supabase-js (localStorage) + refresh automatico.
//
// Modos: ENTRAR (signInWithPassword), CRIAR CONTA (signUp), REDEFINIR (resetPasswordForEmail) e a tela
// de NOVA SENHA (updateUser), acionada quando o link de recuperacao volta com o token (evento
// PASSWORD_RECOVERY). O redirectTo do link e a origem ATUAL (window.location.origin) — em producao,
// https://vitrapremium.com.br. IMPORTANTE (config no painel Supabase, fora do codigo): o "Site URL" e a
// allowlist de "Redirect URLs" precisam apontar para a producao, senao o e-mail cai em localhost.

const MIN_PASSWORD = 6
const INPUT_CLS = 'mt-1.5 w-full rounded-lg border border-white/12 bg-[#0A1628] px-3.5 py-2.5 text-[15px] text-white outline-none transition focus:border-[#C4942A] focus:ring-2 focus:ring-[#C4942A]/30'

function friendlyError(message = '') {
  if (/invalid login/i.test(message)) return 'E-mail ou senha incorretos.'
  if (/already registered|already exists|User already/i.test(message)) return 'Este e-mail ja tem conta. Faca login.'
  if (/password should be at least|weak password|at least 6/i.test(message)) return `A senha precisa de ao menos ${MIN_PASSWORD} caracteres.`
  if (/same as the old|different from the old/i.test(message)) return 'A nova senha precisa ser diferente da anterior.'
  if (/signups? not allowed|signup is disabled/i.test(message)) return 'Cadastro desativado. Peca acesso ao administrador.'
  if (/for security purposes|rate limit|too many/i.test(message)) return 'Muitas tentativas. Aguarde um instante e tente de novo.'
  if (/unable to validate email|invalid email/i.test(message)) return 'E-mail invalido.'
  if (/session|expired|jwt/i.test(message)) return 'Sua sessao de redefinicao expirou. Peca um novo link.'
  return message || 'Nao foi possivel concluir. Tente novamente.'
}

// Shell visual comum (logo + card) — reutilizado por todas as telas de auth.
function AuthShell({ children }) {
  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-[#0A1628] px-4 py-8"
      style={{ backgroundImage: 'radial-gradient(60% 50% at 78% 8%, rgba(196,148,42,0.10), transparent 70%)' }}>
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8"><VitraHorizontalLogo className="h-9 w-auto" /></div>
        <div className="rounded-2xl border border-[#C4942A]/25 bg-[#0E1D38]/80 backdrop-blur px-7 py-8 shadow-[0_18px_50px_rgba(5,12,22,0.55)]">
          {children}
        </div>
      </div>
    </div>
  )
}

function AuthScreen({ initialError = '' }) {
  const [mode, setMode] = useState(initialError ? 'reset' : 'signin') // 'signin' | 'signup' | 'reset'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [notice, setNotice] = useState('')

  const isSignup = mode === 'signup'
  const isReset = mode === 'reset'

  function switchMode(next) {
    setMode(next); setError(''); setNotice(''); setPassword(''); setConfirm('')
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError(''); setNotice('')

    // REDEFINIR: envia o link de recuperacao para a origem atual (producao ou dev).
    if (isReset) {
      setBusy(true)
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
      setBusy(false)
      if (authError) return setError(friendlyError(authError.message))
      setNotice('Se este e-mail tiver conta, enviamos um link para redefinir a senha. Verifique a caixa de entrada (e o spam) — o link vale por 1 hora.')
      return
    }

    if (isSignup) {
      if (password.length < MIN_PASSWORD) return setError(`A senha precisa de ao menos ${MIN_PASSWORD} caracteres.`)
      if (password !== confirm) return setError('As senhas nao conferem.')
      setBusy(true)
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(), password, options: { data: { full_name: name.trim() || null } },
      })
      setBusy(false)
      if (authError) return setError(friendlyError(authError.message))
      if (!data?.session) { setNotice('Conta criada. Enviamos um e-mail de confirmacao — confirme para entrar.'); switchMode('signin') }
      return
    }

    setBusy(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (authError) setError(friendlyError(authError.message))
    // Sucesso: onAuthStateChange no AuthGate troca para o app.
  }

  const canSubmit = isReset ? Boolean(email) : Boolean(email && password && (!isSignup || (confirm && password.length >= MIN_PASSWORD)))
  const title = isReset ? 'Redefinir senha' : isSignup ? 'Criar conta' : 'Entrar'
  const subtitle = isReset ? 'Enviaremos um link para o seu e-mail.' : isSignup ? 'Cadastre-se para acessar a central.' : 'Acesso restrito a equipe Vitra.'
  const submitLabel = busy
    ? (isReset ? 'Enviando…' : isSignup ? 'Criando…' : 'Entrando…')
    : (isReset ? 'Enviar link' : isSignup ? 'Criar conta' : 'Entrar')

  return (
    <AuthShell>
      <form onSubmit={onSubmit}>
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#C4942A] uppercase">Operacao Imobiliaria</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/55">{subtitle}</p>

        {isSignup && (
          <>
            <label className="mt-6 block text-sm text-white/80" htmlFor="auth-name">Nome</label>
            <input id="auth-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS} placeholder="Seu nome" />
          </>
        )}

        <label className={`${isSignup ? 'mt-4' : 'mt-6'} block text-sm text-white/80`} htmlFor="auth-email">E-mail</label>
        <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLS} placeholder="voce@vitra.com.br" />

        {!isReset && (
          <>
            <div className="mt-4 flex items-center justify-between">
              <label className="block text-sm text-white/80" htmlFor="auth-password">Senha</label>
              {!isSignup && (
                <button type="button" onClick={() => switchMode('reset')} className="text-xs font-medium text-[#C4942A] hover:text-[#d4a84a] underline-offset-2 hover:underline">Esqueci minha senha</button>
              )}
            </div>
            <input id="auth-password" type="password" required value={password} autoComplete={isSignup ? 'new-password' : 'current-password'} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLS} placeholder={isSignup ? `Ao menos ${MIN_PASSWORD} caracteres` : '••••••••'} />
          </>
        )}

        {isSignup && (
          <>
            <label className="mt-4 block text-sm text-white/80" htmlFor="auth-confirm">Confirmar senha</label>
            <input id="auth-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={INPUT_CLS} placeholder="Repita a senha" />
          </>
        )}

        {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p>}

        <button type="submit" disabled={busy || !canSubmit} className="mt-6 w-full rounded-lg bg-[#C4942A] px-4 py-2.5 text-[15px] font-semibold text-[#0A1628] transition hover:bg-[#d4a84a] disabled:cursor-not-allowed disabled:opacity-50">
          {submitLabel}
        </button>

        {isReset ? (
          <p className="mt-5 text-center text-sm text-white/55">
            <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-[#C4942A] hover:text-[#d4a84a] underline-offset-2 hover:underline">Voltar para entrar</button>
          </p>
        ) : (
          <p className="mt-5 text-center text-sm text-white/55">
            {isSignup ? 'Ja tem conta?' : 'Nao tem conta?'}{' '}
            <button type="button" onClick={() => switchMode(isSignup ? 'signin' : 'signup')} className="font-semibold text-[#C4942A] hover:text-[#d4a84a] underline-offset-2 hover:underline">
              {isSignup ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        )}
      </form>
    </AuthShell>
  )
}

// Tela de NOVA SENHA — acionada pelo link de recuperacao (evento PASSWORD_RECOVERY). A sessao ja esta
// ativa (o token do link autenticou); aqui so trocamos a senha via updateUser.
function RecoveryScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD) return setError(`A senha precisa de ao menos ${MIN_PASSWORD} caracteres.`)
    if (password !== confirm) return setError('As senhas nao conferem.')
    setBusy(true)
    const { error: authError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (authError) return setError(friendlyError(authError.message))
    setDone(true)
    window.setTimeout(() => onDone?.(), 900) // sessao ja ativa -> entra no app
  }

  return (
    <AuthShell>
      <form onSubmit={submit}>
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#C4942A] uppercase">Operacao Imobiliaria</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-white">Definir nova senha</h1>
        <p className="mt-1 text-sm text-white/55">Escolha uma nova senha para sua conta.</p>

        <label className="mt-6 block text-sm text-white/80" htmlFor="rec-password">Nova senha</label>
        <input id="rec-password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLS} placeholder={`Ao menos ${MIN_PASSWORD} caracteres`} />

        <label className="mt-4 block text-sm text-white/80" htmlFor="rec-confirm">Confirmar senha</label>
        <input id="rec-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={INPUT_CLS} placeholder="Repita a senha" />

        {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {done && <p role="status" className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Senha atualizada. Entrando…</p>}

        <button type="submit" disabled={busy || done || !password || !confirm} className="mt-6 w-full rounded-lg bg-[#C4942A] px-4 py-2.5 text-[15px] font-semibold text-[#0A1628] transition hover:bg-[#d4a84a] disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </AuthShell>
  )
}

export default function AuthGate({ children }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'authed' | 'anon'
  const [recovery, setRecovery] = useState(false)
  const [hashError, setHashError] = useState('')

  useEffect(() => {
    // Link de recuperacao voltou com ERRO no hash (ex.: expirado): mostra mensagem e LIMPA o hash — para
    // nao confundir o roteador por hash do app. So limpamos hashes de erro (nunca um hash com token valido).
    try {
      const raw = window.location.hash.replace(/^#\/?/, '')
      const params = new URLSearchParams(raw)
      const code = params.get('error_code') || params.get('error')
      if (code && !params.get('access_token')) {
        setHashError(/expired|otp_expired/i.test(code)
          ? 'O link de redefinicao expirou ou ja foi usado. Peca um novo abaixo.'
          : 'Nao foi possivel validar o link de redefinicao. Peca um novo abaixo.')
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    } catch { /* hash malformado: ignora */ }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setStatus(data?.session ? 'authed' : 'anon')
    }).catch(() => { if (active) setStatus('anon') })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
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

  // Recuperacao tem prioridade: mesmo com sessao ativa (o token autenticou), pedimos a nova senha antes.
  if (recovery) return <RecoveryScreen onDone={() => setRecovery(false)} />
  if (status !== 'authed') return <AuthScreen initialError={hashError} />
  return children
}
