// Modal de edição de um anúncio Meta: campos do Gerenciador (nome, texto, título, descrição, CTA, UTM) +
// porta in-app da skill vitra-copy (gera e valida 3 ângulos). Extraído de PremiumDashboard.jsx (Onda 4).

import { useState } from 'react'
import { Loader2, Sparkles, Check } from 'lucide-react'
import { Modal } from './ui/index.js'
import { Field } from './Field.jsx'
import VitraSelect from './VitraSelect.jsx'
import { errorMessage } from '../lib/errorMessage.js'
import { generateAdCopyAngles, revalidateCopyAngle } from '../lib/premiumData.js'
import { BRAND_SCOPES } from '../lib/brandProfiles.js'

const CTA_OPTIONS = [
  'Enviar mensagem pelo WhatsApp',
  'Saiba mais',
  'Cadastre-se',
  'Fale conosco',
  'Solicitar curadoria',
  'Conheça o projeto',
]

export function AdEditModal({ ad, campaign = null, brandScope = BRAND_SCOPES.imobiliaria, saving, onClose, onSave }) {
  const a0 = ad.assets[0] || {}
  const m = a0.metadata?.meta_ad || {}
  const [form, setForm] = useState({
    nome: m.nome || `${ad.label} | Meta Ads`,
    texto_principal: m.texto_principal || a0.copy || '',
    titulo: a0.headline || '',
    descricao: m.descricao || '',
    cta: a0.cta || CTA_OPTIONS[0],
    url_params: m.url_params || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inputClass = 'form-input'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'

  // Porta in-app da skill vitra-copy: gera 3 angulos a partir dos fatos da campanha e aplica ao anuncio.
  const [ai, setAi] = useState({ loading: false, error: null, drafts: null })
  async function handleGenerateAdCopy() {
    if (!campaign) return
    setAi(s => ({ ...s, loading: true, error: null }))
    try {
      const angles = await generateAdCopyAngles({ campaign, brandScope })
      if (!angles.length) throw new Error('A IA nao retornou angulos. Tente de novo.')
      const productName = campaign?.product_name || campaign?.brief?.product_data?.name || ''
      const drafts = angles.map(a => ({
        ...a,
        issues: revalidateCopyAngle(
          { headline: a.headline, body: a.body, cta: a.cta },
          { scope: brandScope, headlineMax: 40, productName, channel: 'paid' },
        ),
      }))
      setAi({ loading: false, error: null, drafts })
    } catch (err) {
      setAi(s => ({ ...s, loading: false, error: errorMessage(err) }))
    }
  }
  function applyAngle(d) {
    // CTA do angulo e uma FRASE de copy, nao o enum de CTA da Meta — por isso aplicamos so os 3 campos de
    // texto e mantemos o seletor de CTA (enum) como esta. Conjunto volta para a fila no Salvar (re-render).
    setForm(f => ({ ...f, titulo: d.headline || f.titulo, texto_principal: d.body || f.texto_principal, descricao: d.description || f.descricao }))
  }

  const descricaoMissing = !(form.descricao || '').trim()
  function submit(event) {
    event.preventDefault()
    if (descricaoMissing) return // descrição é obrigatória — bloqueia salvar (campo enriquecido p/ a Meta)
    onSave(ad.assets, form)
  }

  // Migrado para o primitivo <Modal> (Onda 2): foco-preso, Esc, scroll-lock, restauracao de foco e
  // role=dialog/aria-modal. O Modal ja provê o scroll do corpo — o form perde o max-h/overflow proprios.
  return (
    <Modal open onClose={onClose} title={`Editar anúncio · ${ad.label}`} description="Campos do Gerenciador da Meta · aplica aos 3 cortes" size="md">
        <form onSubmit={submit} autoComplete="off" className="space-y-4">
          {/* Porta in-app da vitra-copy: 3 ângulos validados a partir dos fatos da campanha → aplica ao anúncio */}
          <div className="rounded-xl border border-gold-500/25 bg-gold-500/[0.06] px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-200/80">Copy por IA · vitra-copy</p>
                <p className="mt-0.5 text-[11px] leading-4 text-white/45">3 ângulos (preço-âncora · aspiração · escassez) a partir dos dados do imóvel.</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAdCopy}
                disabled={ai.loading || !campaign}
                title={!campaign ? 'Abra o anúncio pelo fluxo da campanha para gerar copy' : ''}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/15 px-3 py-1.5 text-xs font-semibold text-gold-100 transition hover:bg-gold-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ai.loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {ai.loading ? 'Gerando…' : ai.drafts ? 'Gerar de novo' : 'Gerar 3 ângulos'}
              </button>
            </div>
            {!campaign && <p className="mt-2 text-[11px] text-amber-200/80">Sem campanha vinculada a este anúncio — não dá para puxar os fatos do imóvel.</p>}
            {ai.error && <p className="mt-2 rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300">{ai.error}</p>}
            {Array.isArray(ai.drafts) && ai.drafts.length > 0 && (
              <ul className="mt-3 space-y-2">
                {ai.drafts.map((d, i) => (
                  <li key={i} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gold-200/70">{d.angle || d.key || `Ângulo ${i + 1}`}</span>
                      <button type="button" onClick={() => applyAngle(d)} className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">Aplicar a este anúncio</button>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-white/85">{d.headline} <span className="text-[10px] font-normal text-white/35">({(d.headline || '').length}/40)</span></p>
                    <p className="mt-1 text-[11px] leading-5 text-white/60">{d.body}</p>
                    {d.description && <p className="mt-1 text-[11px] leading-4 text-white/40">↳ {d.description}</p>}
                    {d.cta && <p className="mt-1 text-[10px] text-white/45">CTA sugerido: <span className="text-white/65">{d.cta}</span></p>}
                    {Array.isArray(d.issues) && d.issues.length > 0 && (
                      <p className="mt-1.5 text-[10px] leading-4 text-amber-300">⚠ {d.issues.join(' · ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Field label="Nome do anúncio" labelClass={labelClass}>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Texto principal" labelClass={labelClass}>
            <textarea value={form.texto_principal} onChange={e => set('texto_principal', e.target.value)} className={`${inputClass} min-h-28 resize-y`} placeholder="Legenda do anúncio (com emojis, benefícios, etc.)" />
          </Field>
          <Field label="Título" labelClass={labelClass}>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)} className={inputClass} placeholder="Ex: Converse conosco" />
          </Field>
          <Field label="Descrição (obrigatória)" labelClass={labelClass}>
            <input value={form.descricao} onChange={e => set('descricao', e.target.value)} className={`${inputClass} ${descricaoMissing ? '!border-amber-400/50' : ''}`} placeholder="1 linha de reforço do texto (ex.: 3 dorm, 2 vagas, lazer completo — agende a visita)" />
            {descricaoMissing && <p className="mt-1 text-[11px] text-amber-300">Campo obrigatório — preencha ou use "Gerar 3 ângulos" para a IA completar (entra na descrição do anúncio na Meta).</p>}
          </Field>
          <Field label="Chamada para ação (CTA)" labelClass={labelClass}>
            <VitraSelect value={form.cta} onChange={v => set('cta', v)} ariaLabel="CTA" options={CTA_OPTIONS} />
          </Field>
          <Field label="Parâmetros de URL (UTM)" labelClass={labelClass}>
            <input value={form.url_params} onChange={e => set('url_params', e.target.value)} className={inputClass} placeholder="utm_source=meta&utm_medium=paid&utm_campaign=..." />
          </Field>
          <p className="text-[11px] leading-5 text-white/40">
            Título e CTA entram no criativo e o conjunto volta para a fila para re-render nos 3 cortes. Texto principal, descrição e UTM ficam salvos para você colar no Gerenciador.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/65 transition hover:text-white">Cancelar</button>
            <button type="submit" disabled={saving || descricaoMissing} title={descricaoMissing ? 'Preencha a descrição (obrigatória) para salvar' : ''} className="inline-flex items-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/15 px-4 py-2 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Salvar anúncio
            </button>
          </div>
        </form>
    </Modal>
  )
}
