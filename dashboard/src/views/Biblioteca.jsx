import { useEffect, useRef, useState } from 'react'
import { Images, Upload, Copy, Download, Trash2, Loader2, Check, ImageOff } from 'lucide-react'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'
import { BRAND_SCOPES } from '../lib/brandProfiles.js'
import { listMediaAssets, uploadMediaAsset, deleteMediaAsset } from '../lib/premiumData.js'

// Biblioteca (DAM) — repositorio de midia organica reutilizavel por marca: artes geradas (auto-
// registradas pelo "Salvar no post") + fotos enviadas. Reusa o bucket publico 'cards'.
const BRAND_FILTERS = [
  { key: 'todos', label: 'Todas', scope: null },
  { key: 'imob', label: 'Imobiliária', scope: BRAND_SCOPES.imobiliaria },
  { key: 'premium', label: 'Premium', scope: BRAND_SCOPES.premium },
]
const KIND_LABEL = { art: 'Arte', photo: 'Foto' }

export default function Biblioteca() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState('todos')
  const [kind, setKind] = useState('todos')
  const [busy, setBusy] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const brandFilter = BRAND_FILTERS.find(b => b.key === brand) || BRAND_FILTERS[0]

  async function load() {
    setLoading(true); setError(null)
    try { setItems(await listMediaAssets(brandFilter.scope)) }
    catch (e) { setError(e) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [brand])

  const filtered = kind === 'todos' ? items : items.filter(i => i.kind === kind)
  // Marca alvo do upload: a marca filtrada, ou Imobiliária quando "Todas".
  const uploadScope = brandFilter.scope || BRAND_SCOPES.imobiliaria

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError(null)
    try {
      await uploadMediaAsset({ brandScope: uploadScope, file, kind: 'photo' })
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err) { setError(err) } finally { setBusy(false) }
  }

  async function copy(item) {
    try { await navigator.clipboard.writeText(item.url); setCopiedId(item.id); setTimeout(() => setCopiedId(null), 1500) } catch { /* clipboard indisponivel */ }
  }

  async function remove(item) {
    if (!window.confirm('Excluir esta mídia da biblioteca? Esta ação remove o arquivo do storage.')) return
    setBusy(true); setError(null)
    try { await deleteMediaAsset(item); await load() }
    catch (err) { setError(err) } finally { setBusy(false) }
  }

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Acervo de conteúdo"
        title="Biblioteca"
        subtitle={`${items.length} mídia(s) reutilizável(is) — artes geradas e fotos do acervo, por marca.`}
        actions={
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-[color:var(--surface-0)] transition hover:bg-gold-400 disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              Enviar mídia{brandFilter.scope ? '' : ' (Imobiliária)'}
            </button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {BRAND_FILTERS.map(b => (
            <button key={b.key} onClick={() => setBrand(b.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${brand === b.key ? 'bg-gold-500/15 text-gold-200' : 'text-white/55 hover:text-white'}`}>
              {b.label}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {[{ k: 'todos', l: 'Tudo' }, { k: 'art', l: 'Artes' }, { k: 'photo', l: 'Fotos' }].map(o => (
            <button key={o.k} onClick={() => setKind(o.k)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${kind === o.k ? 'bg-gold-500/15 text-gold-200' : 'text-white/55 hover:text-white'}`}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">{error.message || String(error)}</p>}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={20} className="animate-spin text-gold-300" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/20 bg-gold-500/5">
            <ImageOff size={20} className="text-gold-500/70" />
          </div>
          <p className="text-sm font-medium text-white/85">Acervo vazio nesta visão</p>
          <p className="mt-1.5 max-w-sm text-xs text-white/45">Envie uma foto ou gere a arte de um post (“Gerar arte” → “Salvar no post”) — ela é registrada aqui automaticamente.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map(item => (
            <div key={item.id} className="group overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-1)]">
              <div className="relative aspect-square bg-black/30">
                <img src={item.url} alt={item.title || ''} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/55 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/80">{KIND_LABEL[item.kind] || item.kind}</span>
              </div>
              <div className="p-3">
                <p className="truncate text-xs text-white/75" title={item.title || ''}>{item.title || 'Sem título'}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <button onClick={() => copy(item)} title="Copiar URL" className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/60 hover:text-white">
                    {copiedId === item.id ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}{copiedId === item.id ? 'Copiado' : 'URL'}
                  </button>
                  <a href={item.url} target="_blank" rel="noreferrer" download title="Baixar" className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/60 hover:text-white">
                    <Download size={12} />
                  </a>
                  <button onClick={() => remove(item)} disabled={busy} title="Excluir" className="ml-auto inline-flex items-center rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/40 hover:border-red-400/40 hover:text-red-300 disabled:opacity-50">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
