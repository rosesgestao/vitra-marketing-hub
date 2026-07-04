// Card de um anúncio Meta (grupo dos 3 cortes): preview multi-formato, QA operacional acionável e ações
// (aprovar/baixar/editar). Extraído de PremiumDashboard.jsx (Onda 4 — split de componentes).

import { useState } from 'react'
import { Megaphone, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle, Check, Clock, Download, Pencil } from 'lucide-react'
import { StatusPill } from './StatusPill.jsx'
import { META_PLACEMENTS } from '../lib/metaAds.js'
import { AD_FORMAT_ORDER, evaluateMetaAdReadiness } from '../lib/metaAdReadiness.js'
import { needsVitraImobiliariaApprovedTemplateRender, isRenderablePendingAsset } from '../lib/premiumData.js'
import { humanizeLintList } from '../lib/lintText.js'

// Dica (tooltip) por check de QA + o que cada pendência significa — some legibilidade e vira ação (P1.5/P2.3).
const META_QA_HINTS = {
  formats: 'Os 3 cortes Meta (1:1, 9:16, 1.91:1) precisam existir.',
  property_image: 'Cada corte precisa apontar a foto de origem do imóvel.',
  render: 'Todos os cortes renderizados (com imagem) e aprovados.',
  design_lint: 'Validação visual objetiva (lint): nenhum corte pode reprovar.',
  texts: 'Título, texto principal e CTA preenchidos.',
  description: 'Descrição do anúncio (1 linha de reforço) preenchida.',
  destination: 'Destino/UTM definido (site ou WhatsApp).',
  approval: 'Aprovação humana de todos os cortes.',
}

export function MetaAdCard({ ad, busy, rendering = false, onApprove, onEdit }) {
  const ordered = [...ad.assets].sort(
    (a, b) => AD_FORMAT_ORDER.indexOf(a.aspect_ratio) - AD_FORMAT_ORDER.indexOf(b.aspect_ratio),
  )
  const [idx, setIdx] = useState(0)
  const [safeZone, setSafeZone] = useState(false)   // P2.1 — overlay de zona segura no preview
  const safeIdx = Math.min(idx, ordered.length - 1)
  const current = ordered[safeIdx]
  const place = META_PLACEMENTS[current?.aspect_ratio] || {}
  const currentNeedsRender = needsVitraImobiliariaApprovedTemplateRender(current)
  const hasPendingRender = ad.assets.some(a => isRenderablePendingAsset(a))
  const hasRenderableImage = Boolean(current?.public_url) && !currentNeedsRender
  const allApproved = ad.assets.every(a => a.status === 'approved' && !needsVitraImobiliariaApprovedTemplateRender(a))
  const meta = ad.assets[0]?.metadata?.meta_ad || {}
  const headline = ad.assets[0]?.headline || ''
  const cta = ad.assets[0]?.cta || ''
  const visualTemplate = ad.assets[0]?.metadata?.visual_template || {}
  const readiness = evaluateMetaAdReadiness(ad)
  const pendingChecks = readiness.checks.filter(check => !check.ok).length
  const fileName = `${ad.key}-${(current?.aspect_ratio || '').replace(':', 'x')}.png`
  // P1.5 — pendência acionável: clicar num check reprovado leva à correção.
  // texts/description/destino abrem o editor do anúncio; lint salta o preview para o corte reprovado.
  const failedLintIdx = ordered.findIndex(a => a?.metadata?.lint?.ok === false)
  const checkAction = id => {
    if (id === 'texts' || id === 'description' || id === 'destination') return () => onEdit?.()
    if (id === 'design_lint' && failedLintIdx >= 0) return () => setIdx(failedLintIdx)
    return null
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gold-500/20 bg-[color:var(--surface-1)]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Megaphone size={14} className="text-gold-400" />
          <p className="text-sm font-semibold text-white">Anúncio · {ad.label}</p>
        </div>
        <StatusPill value={allApproved ? 'approved' : currentNeedsRender ? 'queued' : current?.status} />
      </div>

      {/* P2.1 — os 3 formatos juntos: miniatura de cada corte, visível de uma vez; clique enfoca no preview. */}
      <div className="flex gap-1.5 px-3 pt-3">
        {ordered.map((a, i) => {
          const p = META_PLACEMENTS[a.aspect_ratio] || {}
          const active = i === safeIdx
          const thumb = Boolean(a.public_url) && !needsVitraImobiliariaApprovedTemplateRender(a)
          return (
            <button
              key={a.id}
              onClick={() => setIdx(i)}
              title={`${a.aspect_ratio} · ${p.label || ''}`}
              className={`flex flex-1 flex-col items-center gap-1 rounded-md border p-1 transition ${active ? 'border-gold-500/45 bg-gold-500/15' : 'border-transparent bg-white/[0.04] hover:bg-white/[0.07]'}`}
            >
              <span className="flex h-12 w-full items-center justify-center overflow-hidden rounded bg-black">
                {thumb
                  ? <img src={a.public_url} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                  : <ImageIcon size={13} className="text-white/25" />}
              </span>
              <span className={`text-2xs font-semibold ${active ? 'text-gold-200' : 'text-white/55'}`}>
                {a.aspect_ratio}<span className="ml-1 hidden font-normal text-white/40 sm:inline">{p.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative mx-3 mt-3 flex h-60 items-center justify-center overflow-hidden rounded-lg bg-black">
        {hasRenderableImage ? (
          <a href={current.public_url} target="_blank" rel="noopener noreferrer" title="Abrir o corte em tamanho real" className="flex h-full w-full cursor-zoom-in items-center justify-center">
            <img src={current.public_url} alt={current.title} className="max-h-full max-w-full object-contain" loading="lazy" />
          </a>
        ) : (
          (() => {
            const waiting = currentNeedsRender || current?.status === 'queued'
            // Skeleton: enquanto o render global roda e este corte aguarda, o placeholder pulsa (P0.4).
            const skeleton = rendering && waiting
            return (
              <div className={`flex flex-col items-center gap-2 text-white/40 ${skeleton ? 'animate-pulse' : ''}`}>
                {skeleton ? <Loader2 size={22} className="animate-spin text-gold-500/60" /> : <ImageIcon size={22} className="text-gold-500/50" />}
                <span className="text-[11px]">{skeleton ? 'gerando corte…' : waiting ? 'aguardando corte' : 'sem render'}</span>
              </div>
            )
          })()
        )}
        {/* P2.1 — overlay de zona segura: no 9:16 as faixas de topo/base são cobertas pela interface de stories/reels. */}
        {hasRenderableImage && safeZone && (
          <div className="pointer-events-none absolute inset-0">
            {current?.aspect_ratio === '9:16' ? (
              <>
                <div className="absolute inset-x-0 top-0 h-[14%] border-b border-dashed border-red-300/60 bg-red-500/15" />
                <div className="absolute inset-x-0 bottom-0 h-[20%] border-t border-dashed border-red-300/60 bg-red-500/15" />
              </>
            ) : (
              <div className="absolute inset-[6%] border border-dashed border-emerald-300/45" />
            )}
          </div>
        )}
        {hasRenderableImage && (
          <button
            type="button"
            onClick={() => setSafeZone(s => !s)}
            title="Mostrar/ocultar a zona segura (áreas que a interface da Meta pode cobrir)"
            className={`absolute left-2 top-2 rounded px-2 py-1 text-2xs font-medium transition ${safeZone ? 'bg-gold-500/85 text-black' : 'bg-black/55 text-white/80 hover:bg-black/70'}`}
          >
            zona segura
          </button>
        )}
        <span className="absolute right-2 top-2 rounded bg-black/55 px-2 py-1 text-[10px] text-white/80">{place.dim}</span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[11px] text-white/45">
          <span className="text-white/70">{place.label}</span> · {place.sub}
        </p>
        {visualTemplate.label && (
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gold-400/70">{visualTemplate.label}</p>
        )}
      </div>

      <div className="space-y-2 border-t border-white/10 px-4 py-3">
        <AdField label="Título" value={headline} />
        <AdField label="Texto principal" value={meta.texto_principal} clamp />
        <AdField label="CTA" value={cta} />
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {readiness.ok ? <CheckCircle2 size={14} className="text-gold-300" /> : <AlertTriangle size={14} className="text-gold-200" />}
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-white/45">QA operacional</p>
          </div>
          <span className="text-2xs text-white/38">{readiness.ok ? 'exportável' : `${pendingChecks} pendência(s)`}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {readiness.checks.map(check => {
            const action = check.ok ? null : checkAction(check.id)
            const cls = `inline-flex items-center gap-1.5 rounded border px-2 py-1 text-2xs text-left ${
              check.ok
                ? 'border-gold-500/25 bg-gold-500/8 text-gold-100'
                : action
                  ? 'cursor-pointer border-amber-400/30 bg-amber-400/[0.06] text-amber-100/90 transition hover:bg-amber-400/[0.12]'
                  : 'border-white/10 bg-white/[0.025] text-white/38'
            }`
            const icon = check.ok ? <Check size={11} className="shrink-0" /> : <Clock size={11} className="shrink-0" />
            return action ? (
              <button key={check.id} type="button" onClick={action} title={`${META_QA_HINTS[check.id] || ''} Clique para corrigir.`} className={cls}>
                {icon}<span className="truncate">{check.label}</span><span aria-hidden className="ml-auto opacity-70">corrigir →</span>
              </button>
            ) : (
              <span key={check.id} title={META_QA_HINTS[check.id] || ''} className={cls}>
                {icon}<span className="truncate">{check.label}</span>
              </span>
            )
          })}
        </div>
        {Array.isArray(current?.metadata?.lint?.errors) && current.metadata.lint.errors.length > 0 && (
          <div className="mt-2 rounded border border-amber-400/25 bg-amber-400/[0.06] px-2.5 py-1.5">
            <p className="text-3xs font-semibold uppercase tracking-[0.14em] text-amber-200/90">Reprovado na validação visual — corte {current.aspect_ratio}</p>
            <p className="mt-0.5 text-2xs leading-relaxed text-amber-100/80">{humanizeLintList(current.metadata.lint.errors).join(' · ')}</p>
          </div>
        )}
        {(() => {
          const notes = humanizeLintList([...(current?.metadata?.lint?.warnings || []), ...(current?.metadata?.lint?.recommendations || [])])
          if (!notes.length) return null
          return (
            <div className="mt-2 rounded border border-sky-400/20 bg-sky-400/[0.05] px-2.5 py-1.5">
              <p className="text-3xs font-semibold uppercase tracking-[0.14em] text-sky-200/80">Observações de qualidade — não bloqueiam</p>
              <p className="mt-0.5 text-2xs leading-relaxed text-sky-100/70">{notes.join(' · ')}</p>
            </div>
          )
        })()}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
        <button
          onClick={onApprove}
          disabled={busy || allApproved || hasPendingRender}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed"
          style={{
            background: allApproved ? 'rgba(196,148,42,0.12)' : hasPendingRender ? 'rgba(255,255,255,0.05)' : '#C4942A',
            color: allApproved ? '#F0C95C' : hasPendingRender ? 'rgba(255,255,255,0.4)' : '#0A0A0A',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {allApproved ? 'Aprovado' : 'Aprovar anúncio'}
        </button>
        {hasRenderableImage ? (
          <a
            href={current.public_url}
            download={fileName}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:border-gold-500/35 hover:text-white"
          >
            <Download size={13} /> Baixar
          </a>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/30">
            <Download size={13} /> Baixar
          </span>
        )}
        <button
          onClick={onEdit}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:border-gold-500/35 hover:text-white disabled:opacity-60"
        >
          <Pencil size={13} /> Editar
        </button>
      </div>
    </div>
  )
}

function AdField({ label, value, clamp }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className={`text-xs leading-5 text-white/72 ${clamp ? 'line-clamp-2' : 'truncate'}`}>{value || '—'}</p>
    </div>
  )
}
