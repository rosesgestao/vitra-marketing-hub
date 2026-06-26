import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Loader2, Mic, Send, Sparkles, Wand2, X } from 'lucide-react'
import { getBrandProfile } from '../lib/brandProfiles.js'
import { planejarComando, generateCopyWithAI } from '../lib/premiumData.js'

// Copiloto da Operação Imobiliária (MVP Fatia 1): o operador FALA (Web Speech API) ou digita um comando;
// o ORQUESTRADOR (Edge agente-operacao) entende a intenção, extrai os dados e devolve uma PRÉVIA + impacto;
// nada é executado sem o operador confirmar. Copy é executada aqui (generate-copy); criativo/tráfego são
// encaminhados ao módulo existente (que já tem o fluxo com confirm/PAUSED). Reaproveita ~80% do que existe.

// Reconhecimento de voz do navegador (Chrome). Fallback: digitar.
const SpeechRec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null

const SUBAGENTE_LABEL = {
  copy: 'Copywriting', criativo: 'Criativos', trafego: 'Tráfego Pago', consulta: 'Métricas', outro: 'Operação',
}

export default function Copilot({ brandScope, onNavigate }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('idle') // idle | pensando | previa | executando | erro
  const [plan, setPlan] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const recRef = useRef(null)
  const inputRef = useRef(null)
  const brand = getBrandProfile(brandScope)

  useEffect(() => {
    if (!SpeechRec) return
    const rec = new SpeechRec()
    rec.lang = 'pt-BR'
    rec.continuous = false
    rec.interimResults = true
    rec.onresult = e => {
      const txt = Array.from(e.results).map(r => r[0].transcript).join('')
      setInput(txt)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    return () => { try { rec.abort() } catch (_) { /* noop */ } }
  }, [])

  const toggleMic = () => {
    const rec = recRef.current
    if (!rec) return
    if (listening) { rec.stop(); return }
    setInput(''); setError('')
    try { rec.start(); setListening(true) } catch (_) { /* já ativo */ }
  }

  const enviar = async () => {
    const text = input.trim()
    if (!text || status === 'pensando' || status === 'executando') return
    if (listening) { try { recRef.current?.stop() } catch (_) { /* noop */ } }
    setStatus('pensando'); setError(''); setResult(null); setPlan(null)
    try {
      const p = await planejarComando(text, { brandScope, role: 'gestor', context: {} })
      if (!p) throw new Error('Não consegui interpretar o comando.')
      setPlan(p); setStatus('previa')
    } catch (e) {
      setError(e?.message || 'Falha ao interpretar.'); setStatus('erro')
    }
  }

  const trafegoViewId = brandScope === 'vitra_premium' ? 'premium-trafego' : 'imobiliaria-trafego'

  const executar = async () => {
    if (!plan) return
    setStatus('executando'); setError('')
    try {
      if (plan.subagente === 'copy') {
        const a = plan.args || {}
        const angles = await generateCopyWithAI({
          product_name: a.product_name, price: a.price, price_from: a.price_from,
          neighborhood: a.neighborhood, location: a.location, area: a.area, suites: a.suites,
          differentials: a.differentials, tagline: a.mensagem,
        }, brand)
        setResult({ type: 'copy', angles }); setStatus('idle')
      } else if (plan.subagente === 'criativo') {
        setResult({ type: 'nav', label: 'Abrindo o Estúdio de Criativos com o pedido…', view: 'criativos:novo' })
        setStatus('idle'); onNavigate?.('criativos:novo'); setTimeout(() => setOpen(false), 600)
      } else if (plan.subagente === 'trafego') {
        setResult({ type: 'nav', label: 'Abrindo Tráfego Pago para revisar o rascunho (PAUSED)…', view: trafegoViewId })
        setStatus('idle'); onNavigate?.(trafegoViewId); setTimeout(() => setOpen(false), 600)
      } else if (plan.subagente === 'consulta') {
        setResult({ type: 'nav', label: 'Abrindo Métricas…', view: 'metricas' })
        setStatus('idle'); onNavigate?.('metricas'); setTimeout(() => setOpen(false), 600)
      } else {
        setResult({ type: 'msg', label: 'Esse pedido entra numa próxima fase do copiloto. Por ora, use o módulo correspondente no menu.' })
        setStatus('idle')
      }
    } catch (e) {
      setError(e?.message || 'Falha ao executar.'); setStatus('erro')
    }
  }

  const reset = () => { setPlan(null); setResult(null); setError(''); setStatus('idle'); setInput('') }

  return (
    <>
      {/* Botão flutuante */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Copiloto da Operação"
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/40 bg-[color:var(--surface-0)] text-gold-300 shadow-[0_12px_40px_rgba(0,0,0,.45)] transition hover:scale-105 hover:border-gold-400"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-gold-400" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-[60] flex max-h-[78vh] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gold-500/20 bg-[color:var(--surface-0)] shadow-[0_24px_70px_rgba(0,0,0,.55)]">
          {/* header */}
          <div className="flex items-center gap-2.5 border-b border-gold-500/15 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold-500/25 bg-gold-500/10 text-gold-300"><Wand2 size={16} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Copiloto da Operação</p>
              <p className="truncate text-[11px] text-white/45">Fale ou escreva — {brand.name}</p>
            </div>
            {(plan || result) && <button onClick={reset} className="text-[11px] text-gold-300 hover:text-gold-200">Limpar</button>}
          </div>

          {/* corpo */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5">
            {!plan && !result && status !== 'pensando' && (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5 text-[12px] leading-relaxed text-white/55">
                Tente: <span className="text-gold-300">“Gere 5 copies para o Edifício Aurora, 2 suítes, R$ 950 mil no Menino Deus.”</span> ou
                <span className="text-gold-300"> “Crie uma campanha para este imóvel com R$ 50 por dia.”</span>
              </div>
            )}

            {status === 'pensando' && (
              <div className="flex items-center gap-2 text-[12px] text-white/60"><Loader2 size={15} className="animate-spin text-gold-300" /> Entendendo o comando…</div>
            )}

            {/* Prévia do plano */}
            {plan && (
              <div className="rounded-xl border border-gold-500/20 bg-gold-500/[0.05] p-3.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-200">{SUBAGENTE_LABEL[plan.subagente] || 'Operação'}</span>
                  {plan.impacto === 'alto'
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300"><AlertTriangle size={12} /> exige confirmação</span>
                    : <span className="text-[10px] text-emerald-300">rascunho · sem impacto</span>}
                </div>
                <p className="text-[13px] leading-relaxed text-white/85">{plan.previa}</p>

                {Array.isArray(plan.faltando) && plan.faltando.length > 0 && (
                  <div className="mt-2.5 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-2.5">
                    <p className="mb-1 text-[11px] font-semibold text-amber-200">Posso melhorar com (opcional):</p>
                    <ul className="space-y-0.5 text-[12px] text-white/70">
                      {plan.faltando.map((f, i) => <li key={i}>• {f.pergunta}</li>)}
                    </ul>
                    <p className="mt-1.5 text-[11px] text-white/45">Complemente no campo abaixo e envie de novo — ou siga assim.</p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={executar}
                    disabled={status === 'executando'}
                    className="btn-gold flex flex-1 items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {status === 'executando' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    {plan.impacto === 'alto' ? 'Confirmar e abrir' : 'Executar'}
                  </button>
                  <button onClick={reset} className="rounded-lg border border-white/10 px-3 text-[12px] text-white/60 hover:text-white">Cancelar</button>
                </div>
              </div>
            )}

            {/* Resultado: copy */}
            {result?.type === 'copy' && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-300">{result.angles.length} ângulos gerados</p>
                {result.angles.map((a, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gold-400/70">{a.angle || a.key}</p>
                    <p className="mt-1 text-[13px] font-semibold text-white">{a.headline}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/65">{a.body}</p>
                    <p className="mt-1 text-[11px] text-gold-300">{a.cta}</p>
                    {Array.isArray(a.issues) && a.issues.length > 0 && (
                      <p className="mt-1 text-[11px] text-amber-300">⚠ {a.issues.join(' · ')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(result?.type === 'nav' || result?.type === 'msg') && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-[12px] text-white/80">{result.label}</div>
            )}

            {status === 'erro' && error && (
              <div className="rounded-xl border border-rose-400/25 bg-rose-400/[0.07] p-3 text-[12px] text-rose-200">{error}</div>
            )}
          </div>

          {/* input */}
          <div className="border-t border-gold-500/15 p-3">
            <div className="flex items-end gap-2">
              {SpeechRec && (
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-label="Falar"
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition ${listening ? 'animate-pulse border-rose-400/60 bg-rose-400/15 text-rose-300' : 'border-gold-500/25 bg-gold-500/10 text-gold-300 hover:border-gold-400'}`}
                >
                  <Mic size={17} />
                </button>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                rows={1}
                placeholder={listening ? 'Ouvindo…' : 'Fale ou escreva um comando…'}
                className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[13px] text-white placeholder:text-white/35 focus:border-gold-500/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={enviar}
                disabled={!input.trim() || status === 'pensando'}
                aria-label="Enviar"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gold-500/40 bg-gold-500 text-navy-900 transition hover:bg-gold-400 disabled:opacity-40"
                style={{ color: '#0A1628' }}
              >
                <Send size={16} />
              </button>
            </div>
            {!SpeechRec && <p className="mt-1.5 px-1 text-[10px] text-white/35">Comando por voz disponível no Chrome. Aqui você pode digitar.</p>}
          </div>
        </div>
      )}
    </>
  )
}
