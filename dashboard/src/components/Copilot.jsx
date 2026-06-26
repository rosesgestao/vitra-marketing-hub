import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Database, Loader2, Mic, Send, Sparkles, Wand2, X } from 'lucide-react'
import { getBrandProfile } from '../lib/brandProfiles.js'
import {
  planejarComando, generateCopyWithAI, buildMetaDraft, resolveCampaignMediaConfig,
  createAgentConversation, appendAgentMessage, saveAgentRun, resolveImovelContext,
} from '../lib/premiumData.js'

// Copiloto da Operação Imobiliária (MVP, Incremento 2): o operador FALA (Web Speech API) ou digita;
// o ORQUESTRADOR (Edge agente-operacao) entende a intenção, extrai os dados e devolve PRÉVIA + impacto;
// nada é executado sem o operador confirmar. Copy é executada aqui (generate-copy); criativo/tráfego são
// encaminhados ao módulo existente (já com confirm/PAUSED). Reaproveita ~80% do que existe.
//
// Incremento 2 — memória & contexto: conversa MULTI-TURNO (history passada ao orquestrador, então
// "gere o criativo desse imóvel" lembra o imóvel anterior), ENRIQUECIMENTO automático (resolve o imóvel
// citado em premium_campaigns e completa os dados que a plataforma já tem) e AUDITORIA de cada turno
// (agent_conversations/agent_messages/agent_runs). A memória é best-effort: se falhar, o copiloto segue.

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
  // Memória da conversa (multi-turno) + imóvel resolvido do banco para o turno atual.
  const [history, setHistory] = useState([]) // [{ role: 'user'|'assistant', text }]
  const [enriched, setEnriched] = useState(null) // { product_name, ... } resolvido de premium_campaigns
  const convRef = useRef(null) // id da agent_conversations (criada na 1ª mensagem)
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

  // Mescla o que a plataforma já sabe (imóvel resolvido) com o que o usuário disse: o falado VENCE,
  // o banco PREENCHE as lacunas. Assim o copiloto não repergunta o que já está cadastrado.
  const mergeArgs = (args, ctx) => {
    const out = { ...(args || {}) }
    if (!ctx) return out
    for (const k of ['product_name', 'price', 'price_from', 'neighborhood', 'location', 'area', 'suites', 'differentials', 'objetivo']) {
      if (!out[k] && ctx[k]) out[k] = ctx[k]
    }
    return out
  }

  const enviar = async () => {
    const text = input.trim()
    if (!text || status === 'pensando' || status === 'executando') return
    if (listening) { try { recRef.current?.stop() } catch (_) { /* noop */ } }
    setStatus('pensando'); setError(''); setResult(null); setPlan(null); setEnriched(null)
    // Memória: garante a conversa e registra a mensagem do operador.
    if (!convRef.current) convRef.current = await createAgentConversation(brandScope, text.slice(0, 60))
    const userMsg = { role: 'user', text }
    const nextHistory = [...history, userMsg]
    setHistory(nextHistory)
    setInput('')
    appendAgentMessage(convRef.current, 'user', text)
    try {
      // Multi-turno: manda o histórico recente para o orquestrador entender follow-ups ("desse imóvel").
      const p = await planejarComando(text, { brandScope, role: 'gestor', history: nextHistory.slice(-6) })
      if (!p) throw new Error('Não consegui interpretar o comando.')
      // Enriquecimento: resolve o imóvel citado em premium_campaigns (o que já sabemos).
      let ctx = null
      const nome = p.args?.product_name
      if (nome) { try { ctx = await resolveImovelContext(nome, brandScope) } catch (_) { ctx = null } }
      setEnriched(ctx)
      setPlan(p); setStatus('previa')
      setHistory(h => [...h, { role: 'assistant', text: p.previa || p.resumo || '' }])
      appendAgentMessage(convRef.current, 'assistant', p.previa || p.resumo || '')
      saveAgentRun({ conversationId: convRef.current, brandScope, command: text, plan: p, status: 'planned' })
    } catch (e) {
      setError(e?.message || 'Falha ao interpretar.'); setStatus('erro')
      saveAgentRun({ conversationId: convRef.current, brandScope, command: text, plan: null, status: 'error', result: { message: e?.message } })
    }
  }

  const trafegoViewId = brandScope === 'vitra_premium' ? 'premium-trafego' : 'imobiliaria-trafego'

  const executar = async () => {
    if (!plan) return
    setStatus('executando'); setError('')
    const audit = (status, result) => saveAgentRun({ conversationId: convRef.current, brandScope, command: plan.resumo, plan, status, result })
    try {
      if (plan.subagente === 'copy') {
        const a = mergeArgs(plan.args, enriched)
        const angles = await generateCopyWithAI({
          product_name: a.product_name, price: a.price, price_from: a.price_from,
          neighborhood: a.neighborhood, location: a.location, area: a.area, suites: a.suites,
          differentials: a.differentials, tagline: a.mensagem,
        }, brand)
        setResult({ type: 'copy', angles }); setStatus('idle')
        audit('executed', { angles: angles.length, enriched: !!enriched })
      } else if (plan.subagente === 'criativo') {
        setResult({ type: 'nav', label: 'Abrindo o Estúdio de Criativos com o pedido…', view: 'criativos:novo' })
        setStatus('idle'); audit('handoff', { view: 'criativos:novo' }); onNavigate?.('criativos:novo'); setTimeout(() => setOpen(false), 600)
      } else if (plan.subagente === 'trafego') {
        // Fecha o ciclo DENTRO do painel: monta o rascunho PAUSED reusando a Página/conta/objetivo já
        // comprovados do imóvel (sem chutar config sensível). Sem imóvel resolvido ou sem mídia
        // configurada → encaminha ao Tráfego Pago (1ª configuração é feita lá, com tudo à vista).
        const campaignId = enriched?.campaign_id
        const budgetCents = Math.round(Number(plan.args?.daily_budget_brl || 0) * 100)
        const cfg = campaignId ? await resolveCampaignMediaConfig(campaignId, brandScope) : null
        if (!campaignId || !cfg?.hasPage) {
          setResult({ type: 'nav', label: campaignId
            ? 'Este imóvel ainda não tem mídia configurada. Abrindo o Tráfego Pago para a 1ª configuração (Página, formulário, público)…'
            : 'Não identifiquei o imóvel cadastrado. Abrindo o Tráfego Pago para você selecionar e revisar…', view: trafegoViewId })
          setStatus('idle'); audit('handoff', { view: trafegoViewId, campaign_id: campaignId || null, reason: campaignId ? 'no_media_config' : 'no_campaign' })
          onNavigate?.(trafegoViewId); setTimeout(() => setOpen(false), 700)
        } else if (budgetCents < 100) {
          setError('Informe o orçamento diário (ex.: "R$ 50 por dia") para montar o rascunho.'); setStatus('erro')
        } else {
          const built = await buildMetaDraft(campaignId, {
            adAccountId: cfg.adAccountId, pageId: cfg.pageId, dailyBudgetCents: budgetCents,
            objective: cfg.objective, destinationUrl: cfg.destinationUrl,
          })
          setResult({ type: 'trafego', built, budgetCents, viewId: trafegoViewId }); setStatus('idle')
          audit('executed', { built, daily_budget_cents: budgetCents })
        }
      } else if (plan.subagente === 'consulta') {
        setResult({ type: 'nav', label: 'Abrindo Métricas…', view: 'metricas' })
        setStatus('idle'); audit('handoff', { view: 'metricas' }); onNavigate?.('metricas'); setTimeout(() => setOpen(false), 600)
      } else {
        setResult({ type: 'msg', label: 'Esse pedido entra numa próxima fase do copiloto. Por ora, use o módulo correspondente no menu.' })
        setStatus('idle'); audit('handoff', { view: null })
      }
    } catch (e) {
      setError(e?.message || 'Falha ao executar.'); setStatus('erro')
      audit('error', { message: e?.message })
    }
  }

  // Limpa o turno atual (mantém a conversa/memória). "Nova conversa" zera o histórico.
  const reset = () => { setPlan(null); setResult(null); setError(''); setStatus('idle'); setInput(''); setEnriched(null) }
  const novaConversa = () => { reset(); setHistory([]); convRef.current = null }

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
            {history.length > 0 && <button onClick={novaConversa} className="text-[11px] text-gold-300 hover:text-gold-200">Nova conversa</button>}
          </div>

          {/* corpo */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5">
            {!history.length && status !== 'pensando' && (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5 text-[12px] leading-relaxed text-white/55">
                Tente: <span className="text-gold-300">“Gere 5 copies para o Edifício Aurora, 2 suítes, R$ 950 mil no Menino Deus.”</span> ou
                <span className="text-gold-300"> “Crie uma campanha para este imóvel com R$ 50 por dia.”</span>
                <p className="mt-2 text-white/40">Eu lembro do imóvel entre os comandos — depois é só dizer “gere o criativo desse imóvel”.</p>
              </div>
            )}

            {/* Thread da conversa (memória multi-turno) — turnos anteriores ao atual */}
            {history.length > 1 && (
              <div className="space-y-1.5">
                {history.slice(0, -1).map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                    <span className={`inline-block max-w-[85%] rounded-lg px-2.5 py-1.5 text-[12px] leading-snug ${m.role === 'user' ? 'bg-gold-500/15 text-white/85' : 'bg-white/[0.04] text-white/60'}`}>{m.text}</span>
                  </div>
                ))}
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

                {enriched && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1.5 text-[11px] text-emerald-200/90">
                    <Database size={12} className="mt-0.5 flex-shrink-0" />
                    <span>Usei os dados de <b>{enriched.product_name}</b> já cadastrado{[enriched.price, enriched.neighborhood].filter(Boolean).length ? ` (${[enriched.price, enriched.neighborhood].filter(Boolean).join(' · ')})` : ''} — não precisa repetir.</span>
                  </div>
                )}

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

            {/* Resultado: rascunho de tráfego criado PAUSED */}
            {result?.type === 'trafego' && (
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3.5">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-200"><Check size={14} /> Rascunho criado na Meta — PAUSED</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/75">
                  {result.built?.ad_sets} conjunto(s) e {result.built?.ads} anúncio(s), orçamento R$ {(result.budgetCents / 100).toFixed(2).replace('.', ',')}/dia. <b>Nada foi ativado nem gastou verba.</b>
                </p>
                <button
                  onClick={() => { onNavigate?.(result.viewId); setOpen(false) }}
                  className="btn-gold mt-3 flex w-full items-center justify-center gap-2 text-[12px]"
                >Revisar e ativar no Tráfego Pago</button>
                <p className="mt-2 text-[11px] text-white/45">A ativação (que gasta verba) é uma ação separada, com sua confirmação no painel.</p>
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
