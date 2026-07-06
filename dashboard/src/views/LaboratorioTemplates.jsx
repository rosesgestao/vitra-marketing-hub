import { useEffect, useMemo, useState } from 'react'
import { FlaskConical, Check, X, Plus, Trash2, ChevronRight, RefreshCw } from 'lucide-react'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'
import { Button, Badge, EmptyState, ErrorAlert, Segmented, ConfirmModal } from '../components/ui/index.js'
import { BRAND_SCOPES, getBrandProfile } from '../lib/brandProfiles.js'
import {
  selectableCreativeTemplatesForBrand,
  fieldGroupsForTemplate,
  imageSlotsForTemplate,
  variationContractForTemplate,
  referencesForTemplateVariant,
} from '../lib/creativeTemplateCatalog.js'
import {
  listExperimentalTemplates,
  createExperimentalTemplate,
  updateExperimentalTemplate,
  deleteExperimentalTemplate,
} from '../lib/premiumData.js'
import { errorMessage } from '../lib/errorMessage.js'

// LABORATÓRIO DE TEMPLATES (experimento JSON, Fase A). View ISOLADA: pega um template do catálogo,
// mostra a referência aprovada + a ESTRUTURA (schema legível: editáveis × fixos + JSON) e prova o
// CICLO DE VIDA (capturar → aprovar/reprovar + observações + versão), persistido em experimental_templates.
// NÃO renderiza criativo novo (isso é a Fase B) nem toca no catálogo/render oficial.

const STATUS = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  review: { label: 'Em análise', tone: 'warning' },
  approved: { label: 'Aprovado', tone: 'success' },
  rejected: { label: 'Reprovado', tone: 'danger' },
  official: { label: 'Oficial', tone: 'gold' },
  archived: { label: 'Arquivado', tone: 'neutral' },
}
const FORMAT_TABS = [
  { value: 0, label: '1:1' },
  { value: 1, label: '9:16' },
  { value: 2, label: '1.91:1' },
]

// Snapshot do schema derivado do catálogo (contrato + campos + zonas de variação). O JSON é DADO —
// versionável e reutilizável; tokens/paleta são referenciados por dsVersion (não copiados).
function schemaSnapshot(template) {
  const contract = variationContractForTemplate(template)
  return {
    templateId: template.id,
    templateName: template.name,
    family: template.family,
    dsVersion: 'ds-2026-07',
    formats: template.formats || [],
    variants: (template.variants || []).map(v => ({ id: v.id, label: v.label, frame: v.frame })),
    defaultVariant: template.defaultVariant || null,
    fields: (fieldGroupsForTemplate(template) || []).flatMap(g => (g.fields || []).map(f => ({
      key: f.key, label: f.label, required: !!f.required, type: f.type || 'text', maxLength: f.maxLength || null,
    }))),
    imageSlots: (imageSlotsForTemplate(template) || []).map(s => ({ id: s.id, label: s.label, required: !!s.required, multiple: !!s.multiple })),
    variationContract: contract ? { mutableSlots: contract.mutableSlots || [], lockedSlots: contract.lockedSlots || [] } : null,
    fixedBrandRules: template.fixedBrandRules || [],
    renderVersion: template.renderVersion || null,
  }
}

export default function LaboratorioTemplates() {
  const [brandScope, setBrandScope] = useState(BRAND_SCOPES.imobiliaria)
  const brandProfile = getBrandProfile(brandScope)
  const templates = useMemo(() => selectableCreativeTemplatesForBrand(brandScope), [brandScope])
  const [selectedId, setSelectedId] = useState(templates[0]?.id || null)
  const [variantId, setVariantId] = useState(null)
  const [formatIdx, setFormatIdx] = useState(0)

  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const selectedTemplate = templates.find(t => t.id === selectedId) || templates[0] || null
  const activeVariantId = variantId || selectedTemplate?.defaultVariant || selectedTemplate?.variants?.[0]?.id || null
  const experiment = experiments.find(e => e.base_template_id === selectedTemplate?.id) || null

  useEffect(() => { setSelectedId(templates[0]?.id || null); setVariantId(null) }, [brandScope, templates])

  async function load() {
    setLoading(true); setError(null)
    try { setExperiments(await listExperimentalTemplates(brandScope)) }
    catch (err) { setError(err) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [brandScope])

  const refs = selectedTemplate ? referencesForTemplateVariant(selectedTemplate, activeVariantId) : []
  const previewSrc = refs[formatIdx] || refs[0] || selectedTemplate?.preview || null

  async function run(fn) {
    setBusy(true); setError(null)
    try { await fn(); await load() }
    catch (err) { setError(err) }
    finally { setBusy(false) }
  }

  function capture() {
    if (!selectedTemplate) return
    run(() => createExperimentalTemplate({
      brandScope, name: `${selectedTemplate.name} (experimental)`, baseTemplateId: selectedTemplate.id, schema: schemaSnapshot(selectedTemplate),
    }))
  }

  function setStatus(status) {
    if (!experiment) return
    const entry = { at: new Date().toISOString(), status, note: note.trim() || null }
    run(() => updateExperimentalTemplate(experiment.id, { status, history: [entry, ...(experiment.history || [])] }))
    setNote('')
  }

  function bumpVersion() {
    if (!experiment) return
    run(() => updateExperimentalTemplate(experiment.id, {
      version: (experiment.version || 1) + 1,
      schema: schemaSnapshot(selectedTemplate),
      history: [{ at: new Date().toISOString(), status: 'review', note: 'Nova versão (schema recapturado)' }, ...(experiment.history || [])],
    }))
  }

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Experimento · geração por JSON"
        title="Laboratório de Templates"
        subtitle="Fase A — captura o schema de um template, mostra a estrutura (editáveis × fixos) e prova o ciclo de vida (aprovar/reprovar + versão). Isolado: não altera o catálogo nem o render oficial."
        actions={<Button variant="ghost" icon={RefreshCw} onClick={load}>Atualizar</Button>}
      />

      <Segmented
        className="mb-5"
        ariaLabel="Marca"
        value={brandScope}
        onChange={setBrandScope}
        options={[{ value: BRAND_SCOPES.imobiliaria, label: 'Vitra Imobiliária' }, { value: BRAND_SCOPES.premium, label: 'Vitra Premium' }]}
      />

      {error && <ErrorAlert message={errorMessage(error)} onRetry={load} className="mb-5" />}

      {templates.length === 0 ? (
        <EmptyState icon={FlaskConical} title="Nenhum template selecionável nesta marca" />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          {/* Lista de templates */}
          <section aria-label="Templates" className="space-y-2">
            {templates.map(t => {
              const exp = experiments.find(e => e.base_template_id === t.id)
              const st = exp ? STATUS[exp.status] : null
              const active = t.id === selectedTemplate?.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedId(t.id); setVariantId(null) }}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 ${active ? 'border-gold-500/60 bg-gold-500/[0.08]' : 'border-white/10 bg-[color:var(--surface-1)] hover:border-gold-500/30'}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{t.name}</span>
                    <span className="block truncate text-2xs text-white/40">{t.shortName}</span>
                  </span>
                  {st ? <Badge tone={st.tone}>{st.label}</Badge> : <ChevronRight size={15} className="flex-shrink-0 text-white/25" aria-hidden="true" />}
                </button>
              )
            })}
          </section>

          {/* Detalhe do template selecionado */}
          {selectedTemplate && (
            <section className="space-y-5">
              {/* Prévia (referência aprovada) */}
              <div className="rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Prévia do template <span className="text-white/40">(referência aprovada)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variants?.length > 1 && (
                      <Segmented ariaLabel="Moldura" value={activeVariantId} onChange={setVariantId}
                        options={selectedTemplate.variants.map(v => ({ value: v.id, label: v.label }))} />
                    )}
                    <Segmented ariaLabel="Formato" value={formatIdx} onChange={setFormatIdx} options={FORMAT_TABS} />
                  </div>
                </div>
                <div className="grid place-items-center rounded-lg bg-[color:var(--surface-0)] p-3" style={{ minHeight: 220 }}>
                  {previewSrc
                    ? <img src={previewSrc} alt={`Prévia ${selectedTemplate.name}`} className="max-h-[420px] w-auto rounded object-contain" />
                    : <span className="text-xs text-white/35">sem prévia</span>}
                </div>
                <p className="mt-3 text-2xs leading-4 text-white/35">
                  Nesta fase o laboratório valida a <span className="text-white/55">estrutura</span> e o <span className="text-white/55">ciclo de vida</span> do template. A geração de um criativo NOVO a partir do JSON (motor genérico) entra na Fase B.
                </p>
              </div>

              {/* Estrutura (editáveis × fixos) */}
              <div className="rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-4">
                <p className="mb-3 text-sm font-semibold text-white">Estrutura do template</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.16em] text-gold-300/80">Campos editáveis</p>
                    <div className="flex flex-wrap gap-1.5">
                      {schemaSnapshot(selectedTemplate).fields.map(f => (
                        <span key={f.key} className="rounded border border-gold-500/25 bg-gold-500/10 px-2 py-1 text-2xs font-semibold text-gold-100/80">
                          {f.label}{f.required ? ' *' : ''}{f.maxLength ? ` · ${f.maxLength}` : ''}
                        </span>
                      ))}
                      {schemaSnapshot(selectedTemplate).fields.length === 0 && <span className="text-2xs text-white/35">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.16em] text-white/40">Fixos (identidade/estrutura)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...(variationContractForTemplate(selectedTemplate)?.lockedSlots || []), ...(selectedTemplate.fixedBrandRules || [])].map((s, i) => (
                        <span key={`${s}-${i}`} className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-2xs font-semibold text-white/45">{String(s).replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <details className="group mt-4 rounded-lg border border-white/10 bg-black/24 px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-white/55">
                    JSON do schema (avançado)
                    <ChevronRight size={14} className="text-gold-300/70 transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
                  </summary>
                  <pre className="mt-3 max-h-72 overflow-auto rounded bg-black/40 p-3 text-[11px] leading-4 text-white/70">{JSON.stringify(schemaSnapshot(selectedTemplate), null, 2)}</pre>
                </details>
              </div>

              {/* Ciclo de vida */}
              <div className="rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Ciclo de vida</p>
                  {experiment ? <Badge tone={STATUS[experiment.status].tone}>{STATUS[experiment.status].label} · v{experiment.version}</Badge> : <Badge tone="neutral">não capturado</Badge>}
                </div>

                {loading ? (
                  <p className="text-xs text-white/40">Carregando…</p>
                ) : !experiment ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-xs leading-5 text-white/50">Capture este template como um <span className="text-white/75">template experimental</span> para revisar a estrutura e registrar aprovação/versões (isolado do catálogo oficial).</p>
                    <Button variant="gold" icon={Plus} loading={busy} onClick={capture}>Capturar como experimental</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-[0.16em] text-white/40" htmlFor="lab-note">Observação (opcional)</label>
                      <input id="lab-note" value={note} onChange={e => setNote(e.target.value)} className="form-input" placeholder="Ex.: aprovado; contraste do preço ok no 9:16." />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="gold" icon={Check} loading={busy} onClick={() => setStatus('approved')}>Aprovar</Button>
                      <Button variant="danger" icon={X} loading={busy} onClick={() => setStatus('rejected')}>Reprovar</Button>
                      <Button variant="subtle" loading={busy} onClick={() => setStatus('review')}>Marcar em análise</Button>
                      <Button variant="subtle" icon={RefreshCw} loading={busy} onClick={bumpVersion}>Nova versão</Button>
                      <Button variant="ghost" icon={Trash2} onClick={() => setDeleteTarget(experiment)}>Excluir</Button>
                    </div>

                    {(experiment.history || []).length > 0 && (
                      <div>
                        <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.16em] text-white/40">Histórico</p>
                        <ul className="space-y-1.5">
                          {(experiment.history || []).slice(0, 8).map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-2xs text-white/50">
                              <Badge tone={STATUS[h.status]?.tone || 'neutral'}>{STATUS[h.status]?.label || h.status}</Badge>
                              <span className="min-w-0 flex-1">{h.note || '—'}</span>
                              <span className="flex-shrink-0 text-white/30">{new Date(h.at).toLocaleDateString('pt-BR')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { const t = deleteTarget; setDeleteTarget(null); run(() => deleteExperimentalTemplate(t.id)) }}
        title="Excluir template experimental?"
        confirmLabel="Excluir"
        description="Remove só o registro experimental (o template do catálogo não é afetado)."
      />
    </div>
  )
}
