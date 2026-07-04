import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, ImagePlus, Plus, Wand2, X } from 'lucide-react'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'
import { FormField, Input, Segmented, Button, Chip, ErrorAlert } from '../components/ui/index.js'
import {
  buildCreativo1x1,
  buildCreativo191x1,
  buildCreativo9x16,
  fetchAsBase64,
  fileToBase64,
  openHtmlBlob,
} from '../lib/creativoTemplates.js'

const LOGO_PATH = '/brand/vitra-imobiliaria/logos/horizontal/approved/vitra-mae-horizontal-aprovada-8k.png'

const FORMATS = [
  { id: '1x1',    label: '1:1',      dim: '1080 × 1080',  w: 1080, h: 1080, fn: buildCreativo1x1 },
  { id: '9x16',   label: '9:16',     dim: '1080 × 1920',  w: 1080, h: 1920, fn: buildCreativo9x16 },
  { id: '191x1',  label: '1.91:1',   dim: '1200 × 627',   w: 1200, h: 627,  fn: buildCreativo191x1 },
]

const EMPTY_FORM = {
  headline: '',
  bairro: '',
  cidade: 'Porto Alegre',
  preco: '',
  area: '',
  quartos: '',
  suites: '',
  vagas: '',
  cta: 'Agende sua visita',
}

// Escala o criativo para caber dentro de maxW × maxH mantendo proporção.
function previewScale(originalW, originalH, maxW, maxH) {
  const scaleW = maxW / originalW
  const scaleH = maxH / originalH
  return Math.min(scaleW, scaleH, 1)
}

function PhotoSlot({ index, photo, onAdd, onRemove }) {
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const base64 = await fileToBase64(file)
    onAdd(index, base64, file.name)
  }

  function onDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  if (photo) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-gold-500/25" style={{ aspectRatio: '4/3' }}>
        <img src={photo.base64} alt={photo.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-start justify-between p-2">
          <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
            {index === 0 ? 'Herói' : `Foto ${index + 1}`}
          </span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/70 transition-colors hover:bg-red-900/70 hover:text-red-300"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.02] transition-colors hover:border-gold-500/35 hover:bg-gold-500/[0.04]"
      style={{ aspectRatio: '4/3' }}
    >
      <ImagePlus size={20} className="text-white/30" />
      <span className="text-[11px] text-white/35">
        {index === 0 ? 'Herói (principal)' : `Foto ${index + 1}`}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </button>
  )
}

function DiferenciaisInput({ values, onChange }) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Piscina, fitness, salão…"
          className="flex-1"
          aria-label="Adicionar diferencial"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/[0.07] text-gold-300 transition-colors hover:bg-gold-500/15 disabled:opacity-30"
        >
          <Plus size={15} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <Chip key={i} tone="gold">
              {v}
              <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} aria-label={`Remover ${v}`} className="text-gold-300/70 hover:text-white">
                <X size={10} />
              </button>
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}

function FormatPreview({ formatId, htmlContent }) {
  const fmt = FORMATS.find(f => f.id === formatId)
  if (!fmt || !htmlContent) return null

  // Preview container: máx 420px de largura e 520px de altura
  const MAX_W = 420
  const MAX_H = 520
  const scale = previewScale(fmt.w, fmt.h, MAX_W, MAX_H)
  const containerW = Math.round(fmt.w * scale)
  const containerH = Math.round(fmt.h * scale)

  return (
    <div
      className="overflow-hidden rounded-lg border border-white/10 bg-black/40"
      style={{ width: containerW, height: containerH }}
    >
      <iframe
        srcDoc={htmlContent}
        title={`Preview ${fmt.label}`}
        sandbox="allow-scripts"
        style={{
          width: fmt.w,
          height: fmt.h,
          border: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export default function EstudioCriativos() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [diferenciais, setDiferenciais] = useState([])
  const [photos, setPhotos] = useState([null, null, null, null]) // 4 slots
  const [format, setFormat] = useState('1x1')
  const [logoBase64, setLogoBase64] = useState(null)
  const [htmlMap, setHtmlMap] = useState({}) // { '1x1': html, '9x16': html, ... }
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAsBase64(LOGO_PATH).then(b64 => setLogoBase64(b64))
  }, [])

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function onAddPhoto(index, base64, name) {
    setPhotos(prev => {
      const next = [...prev]
      next[index] = { base64, name }
      return next
    })
  }

  function onRemovePhoto(index) {
    setPhotos(prev => {
      const next = [...prev]
      next[index] = null
      return next
    })
  }

  const buildData = useCallback(() => ({
    ...form,
    diferenciais,
    logoSrc: logoBase64 || undefined,
    photos: photos.filter(Boolean).map(p => p.base64),
  }), [form, diferenciais, logoBase64, photos])

  function generateAll() {
    setGenerating(true)
    setError(null)
    try {
      const data = buildData()
      const next = {}
      FORMATS.forEach(fmt => { next[fmt.id] = fmt.fn(data) })
      setHtmlMap(next)
    } catch (e) {
      setError(e?.message || 'Não foi possível gerar os criativos. Revise os dados e tente de novo.')
    } finally {
      setGenerating(false)
    }
  }

  function openFormat(fmtId) {
    const html = htmlMap[fmtId]
    if (html) openHtmlBlob(html)
  }

  const hasContent = form.headline.trim() || photos.some(Boolean)
  const hasGenerated = Object.keys(htmlMap).length === FORMATS.length

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Estúdio de Criativos"
        title="Gerador de criativos imobiliários"
        subtitle="Preencha os dados do imóvel, suba as fotos e gere os três formatos prontos para exportar em PNG — identidade Vitra Imobiliária aplicada automaticamente."
        actions={
          // Escopo de marca EXPLICITO: este estudio produz SEMPRE peca Vitra Imobiliaria (logo/templates
          // da marca-mae). Torna inequivoco para o operador — evita gerar arte Imobiliaria achando que e
          // Premium (contaminacao de marca). Suporte multimarca (seletor + templates Premium) fica no hub
          // de criacao visual unificado (roadmap).
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/[0.08] px-3 py-1.5 text-xs font-semibold text-gold-200">
            <span className="h-2 w-2 rounded-full bg-gold-400" aria-hidden="true" />
            Marca: Vitra Imobiliária
          </span>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_480px]">
        {/* ── FORMULÁRIO ─────────────────────────────────────────────── */}
        <div className="space-y-8">

          {/* Dados do imóvel */}
          <section>
            <p className="label-section mb-4">Dados do imóvel</p>
            <div className="space-y-3">
              <FormField label="Headline / nome do empreendimento">
                <Input
                  type="text"
                  value={form.headline}
                  onChange={e => setField('headline', e.target.value)}
                  placeholder="Ex: Apartamentos 2 e 3 dormitórios no Menino Deus"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Bairro">
                  <Input type="text" value={form.bairro} onChange={e => setField('bairro', e.target.value)} placeholder="Menino Deus" />
                </FormField>
                <FormField label="Cidade">
                  <Input type="text" value={form.cidade} onChange={e => setField('cidade', e.target.value)} placeholder="Porto Alegre" />
                </FormField>
              </div>

              <FormField label="Preço (deixe em branco para omitir)">
                <Input type="text" value={form.preco} onChange={e => setField('preco', e.target.value)} placeholder="R$ 1.080.000" />
              </FormField>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: 'area',    label: 'Área (m²)',    placeholder: '110' },
                  { key: 'quartos', label: 'Quartos',       placeholder: '2' },
                  { key: 'suites',  label: 'Suítes',        placeholder: '1 suíte' },
                  { key: 'vagas',   label: 'Vagas',         placeholder: '2' },
                ].map(({ key, label, placeholder }) => (
                  <FormField key={key} label={label}>
                    <Input type="text" value={form[key]} onChange={e => setField(key, e.target.value)} placeholder={placeholder} />
                  </FormField>
                ))}
              </div>

              <div>
                <label className="form-label">Diferenciais (opcional)</label>
                <DiferenciaisInput values={diferenciais} onChange={setDiferenciais} />
              </div>

              <FormField label="CTA">
                <Input type="text" value={form.cta} onChange={e => setField('cta', e.target.value)} placeholder="Agende sua visita" />
              </FormField>
            </div>
          </section>

          {/* Fotos */}
          <section>
            <p className="label-section mb-1">Fotos do imóvel</p>
            <p className="mb-4 text-xs text-white/40">Foto 1 = herói (fachada principal). Fotos 2–4 = apoio (lazer / interiores).</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((photo, i) => (
                <PhotoSlot
                  key={i}
                  index={i}
                  photo={photo}
                  onAdd={onAddPhoto}
                  onRemove={onRemovePhoto}
                />
              ))}
            </div>
          </section>

          {/* Gerar */}
          <Button
            variant="gold"
            onClick={generateAll}
            disabled={!hasContent}
            loading={generating}
            icon={Wand2}
            className="w-full py-3 text-sm font-bold tracking-wide"
          >
            {generating ? 'Gerando…' : hasGenerated ? 'Regerar todos os formatos' : 'Gerar criativos'}
          </Button>
          {error && <ErrorAlert message={error} onRetry={generateAll} />}
        </div>

        {/* ── PREVIEW + EXPORTAR ─────────────────────────────────────── */}
        <div className="space-y-5">
          <p className="label-section">Prévia e exportação</p>

          {/* Seletor de formato (primitivo Segmented, full-width) */}
          <Segmented
            block
            ariaLabel="Formato do criativo"
            value={format}
            onChange={setFormat}
            className="py-1"
            options={FORMATS.map(fmt => ({
              value: fmt.id,
              label: (
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-sm font-bold">{fmt.label}</span>
                  <span className="text-3xs opacity-70">{fmt.dim}</span>
                </span>
              ),
            }))}
          />

          {/* Preview area */}
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/8 bg-black/30 p-5">
            {!hasGenerated ? (
              <div className="text-center">
                <Wand2 size={32} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/30">Preencha os dados e clique em</p>
                <p className="text-sm font-semibold text-white/30">Gerar criativos</p>
              </div>
            ) : (
              <FormatPreview formatId={format} htmlContent={htmlMap[format]} />
            )}
          </div>

          {/* Botões de exportação */}
          {hasGenerated && (
            <div className="space-y-2">
              {FORMATS.map(fmt => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => openFormat(fmt.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-gold-500/20 bg-gold-500/[0.04] px-4 py-3 text-left transition-colors hover:border-gold-500/40 hover:bg-gold-500/[0.08]"
                >
                  <div>
                    <span className="text-sm font-semibold text-white">{fmt.label}</span>
                    <span className="ml-2 text-xs text-white/40">{fmt.dim} px</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-300">
                    <ExternalLink size={13} />
                    Abrir e exportar PNG
                  </div>
                </button>
              ))}
              <p className="text-[11px] leading-relaxed text-white/35">
                Cada formato abre em nova aba. Clique em <strong className="text-white/50">Baixar PNG</strong> para exportar no tamanho exato.
              </p>
            </div>
          )}

          {/* Dica inicial */}
          {!hasGenerated && (
            <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Como funciona</p>
              <ol className="space-y-1.5 text-xs text-white/40">
                {[
                  'Preencha o headline e os dados do imóvel',
                  'Faça upload das fotos (herói + apoio)',
                  'Clique em "Gerar criativos"',
                  'Abra o formato desejado e exporte o PNG',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-px flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-[10px] font-bold text-gold-400">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
