import { useState } from 'react'
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Ruler, ShieldCheck } from 'lucide-react'
import { PremiumPageHeader, RoadmapNotice } from '../components/PremiumShell.jsx'
import { BrandV } from '../components/PremiumBrand.jsx'
import { BRAND_SCOPES } from '../lib/brandProfiles.js'
import { PECA_STATUS, PECAS_PLATFORMS, countFormats, generatorUrl, getPlatform } from '../lib/pecasCatalog.js'
import { Segmented, Badge, Button } from '../components/ui/index.js'

const BRAND_OPTIONS = [
  { scope: BRAND_SCOPES.imobiliaria, label: 'Imobiliária' },
  { scope: BRAND_SCOPES.premium, label: 'Premium' },
]

const BRAND_BG = {
  [BRAND_SCOPES.imobiliaria]: '#0A1628',
  [BRAND_SCOPES.premium]: '#000000',
}

function openGenerator(file) {
  const url = `${import.meta.env.BASE_URL}pecas/${file}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Wrappers finos sobre os primitivos do design system (call sites inalterados; some o bespoke).
function BrandToggle({ value, onChange }) {
  return (
    <Segmented
      ariaLabel="Marca das peças"
      value={value}
      onChange={onChange}
      options={BRAND_OPTIONS.map(o => ({ value: o.scope, label: o.label }))}
    />
  )
}

function StatusBadge({ status }) {
  return status === PECA_STATUS.available
    ? <Badge tone="success"><ShieldCheck size={11} /> Disponível</Badge>
    : <Badge tone="gold"><Clock size={11} /> Em breve</Badge>
}

// Mini-preview proporcional ao formato, na cor da marca.
function AspectPreview({ w, h, brandScope }) {
  const maxW = 132
  const maxH = 76
  const ratio = w / h
  let boxW = maxW
  let boxH = Math.round(maxW / ratio)
  if (boxH > maxH) {
    boxH = maxH
    boxW = Math.round(maxH * ratio)
  }
  const vSize = Math.max(16, Math.round(Math.min(boxW, boxH) * 0.46))
  return (
    <div className="flex h-[84px] items-center justify-center rounded-md border border-white/10 bg-black/40">
      <div
        className="flex items-center justify-center rounded-[3px] ring-1 ring-gold-500/25"
        style={{ width: boxW, height: boxH, background: BRAND_BG[brandScope] || '#000' }}
      >
        <BrandV brandScope={brandScope} size={vSize} />
      </div>
    </div>
  )
}

function FormatCard({ format, brandScope }) {
  const file = format.variants?.[brandScope]
  const available = format.status === PECA_STATUS.available && Boolean(file)
  return (
    <div className="card-hover flex flex-col">
      <AspectPreview w={format.w} h={format.h} brandScope={brandScope} />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{format.label}</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-gold-300">
            {format.w} × {format.h}
            <span className="ml-1 text-xs font-sans font-normal text-gray-500">px</span>
          </p>
        </div>
        <StatusBadge status={format.status} />
      </div>

      <dl className="mt-3 space-y-1.5 text-[11px] text-white/55">
        <div className="flex items-center gap-2">
          <Ruler size={12} className="text-gold-500/70" />
          <span>Proporção {format.ratio}</span>
        </div>
        {format.safeArea && (
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-gold-500/70" />
            <span>Área segura {format.safeArea}</span>
          </div>
        )}
      </dl>

      {format.note && <p className="mt-3 text-[11px] leading-relaxed text-white/42">{format.note}</p>}

      <div className="mt-auto pt-4">
        {available ? (
          <Button variant="gold" icon={ExternalLink} onClick={() => openGenerator(file)} className="w-full">
            Abrir gerador
          </Button>
        ) : (
          <Button variant="subtle" icon={Clock} disabled className="w-full">
            Em breve
          </Button>
        )}
      </div>
    </div>
  )
}

function PlatformCard({ platform, onNavigate }) {
  const Icon = platform.icon
  return (
    <button
      type="button"
      onClick={() => onNavigate?.(`pecas:${platform.id}`)}
      className="card-hover group flex flex-col text-left"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold-500/20 bg-gold-500/[0.06] text-gold-300">
          <Icon size={20} />
        </div>
        <StatusBadge status={platform.status} />
      </div>

      <p className="mt-4 text-base font-semibold text-white">{platform.label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-white/50">{platform.summary}</p>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-[11px] uppercase tracking-[0.16em] text-gold-500/60">
          {countFormats(platform)} {countFormats(platform) === 1 ? 'formato' : 'formatos'}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gold-300 transition-transform duration-200 group-hover:translate-x-0.5">
          Abrir <ArrowRight size={14} />
        </span>
      </div>
    </button>
  )
}

function Overview({ brandScope, setBrandScope, onNavigate }) {
  const available = PECAS_PLATFORMS.filter(p => p.status === PECA_STATUS.available)
  const soon = PECAS_PLATFORMS.filter(p => p.status === PECA_STATUS.soon)
  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Estúdio de Peças"
        title="Capas & banners por plataforma"
        subtitle="Cada canal tem sua seção, com os formatos e medidas certas. Abra o gerador, ajuste e exporte o PNG — Imobiliária e Premium nunca se misturam."
        actions={<BrandToggle value={brandScope} onChange={setBrandScope} />}
      />

      <p className="label-section mb-3">Disponíveis</p>
      <div className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {available.map(platform => (
          <PlatformCard key={platform.id} platform={platform} onNavigate={onNavigate} />
        ))}
      </div>

      <p className="label-section mb-3">Próximas áreas (roadmap)</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {soon.map(platform => (
          <PlatformCard key={platform.id} platform={platform} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}

function PlatformView({ platform, brandScope, setBrandScope, onNavigate }) {
  const Icon = platform.icon
  const isSoon = platform.status === PECA_STATUS.soon
  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker={
          <button
            type="button"
            onClick={() => onNavigate?.('pecas:overview')}
            className="inline-flex items-center gap-1.5 text-gold-400 transition-colors hover:text-gold-200"
          >
            <ArrowLeft size={12} /> Estúdio de Peças
          </button>
        }
        title={
          <span className="inline-flex items-center gap-3">
            <Icon size={26} className="text-gold-300" />
            {platform.label}
          </span>
        }
        subtitle={platform.summary}
        actions={<BrandToggle value={brandScope} onChange={setBrandScope} />}
      />

      {isSoon && (
        <RoadmapNotice>
          Esta área ainda não tem gerador. Os formatos abaixo já estão dimensionados e prontos para receber a
          mesma esteira das capas atuais (logo aprovada embutida, área segura e export PNG no tamanho exato).
        </RoadmapNotice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {platform.formats.map(format => (
          <FormatCard key={format.id} format={format} brandScope={brandScope} />
        ))}
      </div>
    </div>
  )
}

export default function EstudioPecas({ platformId = 'overview', onNavigate }) {
  const [brandScope, setBrandScope] = useState(BRAND_SCOPES.imobiliaria)

  if (platformId === 'overview') {
    return <Overview brandScope={brandScope} setBrandScope={setBrandScope} onNavigate={onNavigate} />
  }

  const platform = getPlatform(platformId)
  if (!platform) {
    return (
      <div className="premium-page">
        <PremiumPageHeader
          kicker="Estúdio de Peças"
          title="Seção não encontrada"
          subtitle="A plataforma selecionada não existe no catálogo de peças."
          actions={
            <Button variant="ghost" icon={ArrowLeft} onClick={() => onNavigate?.('pecas:overview')}>
              Visão geral
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <PlatformView platform={platform} brandScope={brandScope} setBrandScope={setBrandScope} onNavigate={onNavigate} />
  )
}
