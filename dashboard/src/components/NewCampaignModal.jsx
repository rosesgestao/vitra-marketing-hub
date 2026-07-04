// Modal "Nova campanha" (aba de criação do Tráfego/Ofertas): wizard de 3 passos (Template → Dados & copy →
// Imagens & revisão), com importação por link/IA (extract-facts, suggest-template, generate-copy), campos
// schema-driven do template e upload de imagens. Extraído de PremiumDashboard.jsx (Onda 4).

import { useState, useEffect, useRef, useMemo } from 'react'
import { AlertTriangle, Check, ChevronDown, Loader2, Plus, Upload } from 'lucide-react'
import { Modal } from './ui/index.js'
import { Field } from './Field.jsx'
import { BrandHorizontalLogo } from './PremiumBrand.jsx'
import { errorMessage } from '../lib/errorMessage.js'
import {
  distinctConceptCapacity,
  extractFactsWithAI,
  buildFactsApplyPatch,
  suggestTemplateWithAI,
  generateCopyWithAI,
  revalidateCopyAngle,
  fetchListingText,
} from '../lib/premiumData.js'
import {
  selectableCreativeTemplatesForBrand,
  defaultCreativeTemplateForBrand,
  fieldGroupsForTemplate,
  fieldsForTemplate,
  formKeyForTemplateField,
  imageSlotsForTemplate,
  normalizeCreativeTemplateSelection,
  referencesForTemplateVariant,
  variationContractForTemplate,
} from '../lib/creativeTemplateCatalog.js'

// Nomes humanos (pt-BR) dos slots do contrato de variacao — em vez do id tecnico cru
// (ex.: safe_zone, format_grid, benefit_arrows). Fase 4 (UX).
const SLOT_LABELS = {
  layout: 'Layout', logo: 'Logo', typography: 'Tipografia', palette: 'Paleta',
  safe_zone: 'Margem de seguranca', format_grid: 'Grade de formatos',
  headline: 'Headline', subtitle: 'Subtitulo', price: 'Preco', differentials: 'Diferenciais',
  cta: 'CTA (botao)', photos: 'Fotos', benefit_arrows: 'Setas de beneficio', photo_grid: 'Galeria de fotos',
  features: 'Caracteristicas', location: 'Localizacao', price_box: 'Caixa de preco',
  rounded_photo_frames: 'Molduras das fotos', financing_claim: 'Chamada de financiamento',
  neighborhood: 'Bairro', official_blue_bands: 'Tarjas azuis oficiais', address_lockup: 'Bloco de endereco',
  hero_photo: 'Foto protagonista', condo_argument: 'Argumento do condominio', address: 'Endereco',
}
const humanizeSlot = (slot) => SLOT_LABELS[slot] || String(slot).replace(/_/g, ' ')

const INITIAL_FORM = {
  name: '',
  source_type: 'manual',
  landing_url: '',
  whatsapp_url: '',
  creative_variations: 3,
  creative_template_id: '',
  creative_template_variant: '',
  product_name: '',
  tagline: '',
  property_type: 'Apartamento alto padrão',
  neighborhood: '',
  city: 'Porto Alegre',
  location: '',
  area: '',
  suites: '',
  towers: '',
  differentials: '',
  price: '',
  price_from: '',
  condo_argument: '',
  financing_claim: '',
  suggested_headline: '',
  suggested_copy: '',
  target_audience: 'Compradores e investidores de alto padrão em Porto Alegre',
  campaign_objective: 'lead_generation',
  offer: '',
  cta: 'Conheça o projeto',
  budget_type: 'organic_and_paid',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString().slice(0, 10),
  images: {
    fachada: null,
    living: null,
    varanda: null,
    infraestrutura: null,
    extras: [],
  },
}

const CREATIVE_VARIATION_OPTIONS = [
  { value: 3, label: '3 variacoes por template - 9 cortes' },
  { value: 5, label: '5 variacoes por template - 15 cortes' },
  { value: 8, label: '8 variacoes por template - 24 cortes' },
  { value: 10, label: '10 variacoes por template - 30 cortes' },
  { value: 12, label: '12 variacoes por template - 36 cortes' },
]

function initialFormForBrand(brandProfile) {
  const defaultTemplate = defaultCreativeTemplateForBrand(brandProfile.scope)
  const defaultVariant = defaultTemplate?.variants?.find(variant => variant.id === defaultTemplate.defaultVariant) ||
    defaultTemplate?.variants?.[0] ||
    null

  return {
    ...INITIAL_FORM,
    creative_template_id: defaultTemplate?.id || '',
    creative_template_variant: defaultVariant?.id || '',
    property_type: brandProfile.defaultProductType,
    target_audience: brandProfile.defaultAudience,
    cta: brandProfile.defaultCta,
  }
}

export function NewCampaignModal({ brandProfile, prefill, saving, submitError, onClose, onSubmit }) {
  // Prefill do Copiloto (imóvel ditado, ainda não cadastrado). Capturado UMA vez (ref estável) para não
  // re-aplicar a cada render nem sobrescrever edições do operador.
  const prefillRef = useRef(prefill)
  const [form, setForm] = useState(() => ({ ...initialFormForBrand(brandProfile), ...(prefillRef.current || {}) }))
  const [localError, setLocalError] = useState(null)
  const templateOptions = useMemo(() => selectableCreativeTemplatesForBrand(brandProfile.scope), [brandProfile.scope])
  const { template: selectedTemplate, variant: selectedTemplateVariant } = useMemo(
    () => normalizeCreativeTemplateSelection(brandProfile.scope, form.creative_template_id, form.creative_template_variant),
    [brandProfile.scope, form.creative_template_id, form.creative_template_variant],
  )
  const selectedFieldGroups = useMemo(() => fieldGroupsForTemplate(selectedTemplate), [selectedTemplate])
  const selectedImageSlots = useMemo(() => imageSlotsForTemplate(selectedTemplate), [selectedTemplate])
  const selectedVariationContract = useMemo(
    () => variationContractForTemplate(selectedTemplate),
    [selectedTemplate],
  )

  // Degrau B' (importar de anuncio): estado da extracao + keys preenchidas pela IA. aiFilledKeys fica
  // FORA do form (state local) para nao vazar no payload de submit.
  const [extract, setExtract] = useState({ loading: false, error: null, result: null, sourceText: '', applied: null, phase: null, url: '', fetching: false })
  const [extractMode, setExtractMode] = useState('fill-empty')
  const [aiFilledKeys, setAiFilledKeys] = useState([])
  // Validacao (P0 UX): keys dos obrigatorios faltantes -> destaque inline (borda vermelha + aria-invalid)
  // e foco/scroll no 1o. Antes o erro era so uma string no rodape e o operador cacava os campos no scroll.
  const [missingKeys, setMissingKeys] = useState(() => new Set())
  // Wizard de 3 passos (P0 UX: o modal-monolito de 7 secoes vira Template -> Dados & copy -> Imagens).
  const [step, setStep] = useState(1)
  const [dirty, setDirty] = useState(false) // p/ confirmar descarte ao fechar (nao perder copy IA)
  const STEP_LABELS = ['Template', 'Dados & copy', 'Imagens & revisão']
  // Degrau B: sugestao de template por IA (a IA recomenda; o operador confirma).
  const [suggest, setSuggest] = useState({ loading: false, error: null, result: null })
  // Fluxo unico: ao gerar a copy, rola ate o painel "Copiloto de copy" (que fica abaixo dos campos)
  // para o operador ver que a copy foi gerada. O ref-flag dispara o scroll so apos a copy renderizar.
  const copyPanelRef = useRef(null)
  const pendingCopyScrollRef = useRef(false)

  useEffect(() => {
    if (pendingCopyScrollRef.current && aiCopy.drafts?.length) {
      pendingCopyScrollRef.current = false
      copyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })

  useEffect(() => {
    setForm({ ...initialFormForBrand(brandProfile), ...(prefillRef.current || {}) })
    setLocalError(null)
    setExtract({ loading: false, error: null, result: null, sourceText: '', applied: null, phase: null, url: '', fetching: false })
    setExtractMode('fill-empty')
    setAiFilledKeys([])
    setSuggest({ loading: false, error: null, result: null })
    setStep(1)
    setDirty(false)
    setMissingKeys(new Set())
  }, [brandProfile.scope])

  // Trocar de TEMPLATE muda o conjunto de campos: a extracao anterior (keyed por outras formKeys) e as
  // marcas IA ficam obsoletas. Limpa o resultado/marcas (preserva o texto colado p/ re-extrair).
  useEffect(() => {
    setExtract(state => ({ ...state, result: null, error: null, applied: null }))
    setAiFilledKeys([])
    setSuggest({ loading: false, error: null, result: null })
    // Os rascunhos de copy foram gerados para os fatos do template anterior — limpa pra nao confundir
    // (a copy ja aplicada em form.ai_copy_angles e preservada; e escolha deliberada do operador).
    setAiCopy(state => ({ ...state, drafts: null, error: null }))
  }, [form.creative_template_id])

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
    setDirty(true)
    // Editar um campo preenchido pela IA tira a marca "IA" (sinaliza edicao/aprovacao humana).
    setAiFilledKeys(current => (current.includes(field) ? current.filter(k => k !== field) : current))
  }

  // Copiloto de IA (degrau A): gera, revisa/edita e aplica os angulos de copy na voz da marca.
  // Vale Imobiliaria E Premium (a Edge generate-copy tem a voz de cada marca, alinhada ao brandbook).
  const aiCopyEnabled = true
  const [aiCopy, setAiCopy] = useState({ loading: false, error: null, drafts: null })
  const aiApplied = Array.isArray(form.ai_copy_angles) && form.ai_copy_angles.length > 0

  async function handleGenerateCopy() {
    setAiCopy(state => ({ ...state, loading: true, error: null }))
    try {
      const angles = await generateCopyWithAI(form, brandProfile)
      if (!angles.length) throw new Error('A IA nao retornou angulos. Tente novamente.')
      setAiCopy({ loading: false, error: null, drafts: angles })
    } catch (err) {
      setAiCopy(state => ({ ...state, loading: false, error: errorMessage(err) }))
    }
  }

  function editDraft(index, field, value) {
    // Revalida AO VIVO com as MESMAS regras da Edge (tamanho da headline, nome duplicado, vocabulario
    // fora da marca), em vez de so limpar os badges — guia o operador a manter a edicao dentro da marca.
    const headlineMax = fieldsForTemplate(selectedTemplate).find(f => f.key === 'suggested_headline')?.maxLength || 40
    setAiCopy(state => ({
      ...state,
      drafts: (state.drafts || []).map((d, i) => {
        if (i !== index) return d
        const next = { ...d, [field]: value }
        next.issues = revalidateCopyAngle(next, { scope: brandProfile.scope, headlineMax, productName: form.product_name, channel: 'paid' })
        return next
      }),
    }))
  }

  function applyAiDrafts() {
    const angles = (aiCopy.drafts || []).map(({ key, angle, headline, body, cta }) => ({ key, angle, headline, body, cta }))
    update('ai_copy_angles', angles)
  }

  function clearAiCopy() {
    setAiCopy({ loading: false, error: null, drafts: null })
    update('ai_copy_angles', undefined)
  }

  // Degrau B' do copiloto: a IA le o anuncio colado e PROPOE os campos; o operador revisa e aplica.
  const extractEnabled = selectedFieldGroups.length > 0

  // Degrau B' por LINK: busca o texto da pagina do imovel e PREENCHE a caixa de texto. O operador
  // revisa o que foi lido antes de extrair (rede de seguranca contra fetch fino/ruido).
  async function handleFetchListing() {
    if (!extract.url.trim()) {
      setExtract(state => ({ ...state, error: 'Cole o link do imovel antes de buscar.' }))
      return
    }
    setExtract(state => ({ ...state, fetching: true, error: null }))
    try {
      const { text, warnings } = await fetchListingText(extract.url)
      if (!text) {
        setExtract(state => ({ ...state, fetching: false, error: warnings[0] || 'Nao consegui ler a pagina. Cole o texto do anuncio.' }))
        return
      }
      setExtract(state => ({ ...state, fetching: false, sourceText: text, error: warnings.length ? warnings[0] : null }))
    } catch (err) {
      setExtract(state => ({ ...state, fetching: false, error: errorMessage(err) }))
    }
  }

  async function handleExtractFacts() {
    if (!extract.sourceText.trim()) {
      setExtract(state => ({ ...state, error: 'Cole o texto do anuncio antes de extrair.' }))
      return
    }
    // Reseta `applied` (de uma extracao/aplicacao anterior) para o novo resultado nascer "nao aplicado"
    // e reexibir o botao "Aplicar" + o toggle de modo (gated por !extract.applied).
    setExtract(state => ({ ...state, loading: true, error: null, applied: null }))
    try {
      const result = await extractFactsWithAI(extract.sourceText, selectedTemplate, brandProfile)
      setExtract(state => ({ ...state, loading: false, result }))
    } catch (err) {
      setExtract(state => ({ ...state, loading: false, error: errorMessage(err) }))
    }
  }

  function applyExtracted() {
    const fields = extract.result?.fields || {}
    // Defesa: so aplica campos do template ATUAL (evita keys orfas de um template que foi trocado).
    const allowed = new Set(fieldsForTemplate(selectedTemplate).map(formKeyForTemplateField))
    const scoped = Object.fromEntries(Object.entries(fields).filter(([key]) => allowed.has(key)))
    const { patch, appliedKeys } = buildFactsApplyPatch(form, scoped, { mode: extractMode })
    if (!appliedKeys.length) {
      setExtract(state => ({
        ...state,
        error: extractMode === 'fill-empty'
          ? 'Nada a preencher: os campos encontrados ja estao preenchidos (use "Sobrescrever" para substituir).'
          : 'Nenhum campo com dado ancorado no texto para aplicar.',
      }))
      return
    }
    const prevValues = {}
    appliedKeys.forEach(key => { prevValues[key] = form[key] ?? '' })
    setForm(current => ({ ...current, ...patch }))
    setAiFilledKeys(current => Array.from(new Set([...current, ...appliedKeys])))
    // Acumula o historico de undo: uniao das keys + prevValues com PRIMEIRA captura por key (a
    // captura original vence, mesmo apos applies sucessivos), para o "Desfazer" voltar ao original.
    setExtract(state => ({
      ...state,
      error: null,
      applied: {
        keys: Array.from(new Set([...(state.applied?.keys || []), ...appliedKeys])),
        prevValues: { ...prevValues, ...(state.applied?.prevValues || {}) },
      },
    }))
  }

  function undoExtracted() {
    const applied = extract.applied
    if (!applied) return
    setForm(current => {
      const restore = {}
      // So restaura as keys ainda marcadas como IA (nao mexe no que o operador editou depois).
      applied.keys.forEach(key => { if (aiFilledKeys.includes(key)) restore[key] = applied.prevValues[key] ?? '' })
      return { ...current, ...restore }
    })
    setAiFilledKeys(current => current.filter(key => !applied.keys.includes(key)))
    setExtract(state => ({ ...state, applied: null }))
  }

  function clearExtract() {
    setExtract({ loading: false, error: null, result: null, sourceText: '', applied: null, phase: null, url: '', fetching: false })
    setAiFilledKeys([])
    setSuggest({ loading: false, error: null, result: null })
  }

  // Degrau B: a IA le o anuncio e RECOMENDA o template ideal; o operador confirma ("Usar este template").
  async function handleSuggestTemplate() {
    if (!extract.sourceText.trim()) {
      setSuggest(state => ({ ...state, error: 'Cole o texto do anuncio antes de sugerir o template.' }))
      return
    }
    setSuggest(state => ({ ...state, loading: true, error: null }))
    try {
      const res = await suggestTemplateWithAI(extract.sourceText, brandProfile)
      if (!res || !res.valid || !res.templateId) {
        setSuggest({ loading: false, error: 'A IA nao conseguiu recomendar um template. Escolha manualmente abaixo.', result: null })
        return
      }
      const tpl = templateOptions.find(t => t.id === res.templateId)
      setSuggest({
        loading: false,
        error: null,
        result: { templateId: res.templateId, name: tpl?.name || tpl?.shortName || res.templateId, rationale: res.rationale, confidence: res.confidence },
      })
    } catch (err) {
      setSuggest({ loading: false, error: errorMessage(err), result: null })
    }
  }

  function applySuggestedTemplate() {
    const id = suggest.result?.templateId
    const tpl = id && templateOptions.find(t => t.id === id)
    if (tpl) selectTemplate(tpl) // troca o template (o useEffect de creative_template_id reseta extracao/sugestao)
    setSuggest({ loading: false, error: null, result: null })
  }

  function dismissSuggestion() {
    setSuggest({ loading: false, error: null, result: null })
  }

  // Fluxo unico (degrau B' -> A): extrai os fatos do anuncio, aplica (fill-empty) e JA gera a copy a
  // partir do form preenchido — tudo num clique. Vale Imobiliaria E Premium (a Edge tem a voz de cada
  // marca). Usa o nextForm computado localmente (o state setForm e assincrono) para a copy ver os fatos.
  async function handleExtractAndGenerate() {
    if (!extract.sourceText.trim()) {
      setExtract(state => ({ ...state, error: 'Cole o texto do anuncio antes de extrair.' }))
      return
    }
    // Reseta `applied` (fresh start) e limpa drafts antigos (senao copy de outro imovel fica visivel
    // se o guard de product_name interromper o fluxo).
    setExtract(state => ({ ...state, loading: true, error: null, phase: 'extracting', applied: null }))
    setAiCopy({ loading: false, error: null, drafts: null })
    try {
      // 1. Extrair os fatos do texto.
      const result = await extractFactsWithAI(extract.sourceText, selectedTemplate, brandProfile)
      // 2. Aplicar (fill-empty) — computa o form ja preenchido para a copy ser gerada a partir dele.
      const allowed = new Set(fieldsForTemplate(selectedTemplate).map(formKeyForTemplateField))
      const scoped = Object.fromEntries(Object.entries(result.fields).filter(([key]) => allowed.has(key)))
      const { patch, appliedKeys } = buildFactsApplyPatch(form, scoped, { mode: 'fill-empty' })
      const nextForm = { ...form, ...patch }
      const prevValues = {}
      appliedKeys.forEach(key => { prevValues[key] = form[key] ?? '' })
      setForm(nextForm)
      if (appliedKeys.length) setAiFilledKeys(current => Array.from(new Set([...current, ...appliedKeys])))
      setExtract(state => ({
        ...state,
        result,
        phase: 'generating',
        applied: appliedKeys.length
          ? {
              keys: Array.from(new Set([...(state.applied?.keys || []), ...appliedKeys])),
              prevValues: { ...prevValues, ...(state.applied?.prevValues || {}) },
            }
          : state.applied,
      }))
      // Sem nome do produto, a copy fica fraca: para o fluxo aqui (a extracao ja foi aplicada).
      if (!String(nextForm.product_name || '').trim()) {
        setExtract(state => ({
          ...state,
          loading: false,
          phase: null,
          error: 'Extrai os fatos, mas nao achei o Nome do Produto no texto. Preencha-o e use "Gerar copy com IA" abaixo.',
        }))
        return
      }
      // 3. Gerar a copy a partir do form ja preenchido com os fatos.
      setAiCopy(state => ({ ...state, loading: true, error: null }))
      const angles = await generateCopyWithAI(nextForm, brandProfile)
      if (angles.length) pendingCopyScrollRef.current = true
      setAiCopy({ loading: false, error: angles.length ? null : 'A IA nao retornou angulos. Tente novamente.', drafts: angles.length ? angles : null })
      setExtract(state => ({ ...state, loading: false, phase: null }))
    } catch (err) {
      setExtract(state => ({ ...state, loading: false, phase: null, error: errorMessage(err) }))
      setAiCopy(state => ({ ...state, loading: false }))
    }
  }

  function selectTemplate(template) {
    const variant = template.variants?.find(item => item.id === template.defaultVariant) ||
      template.variants?.[0] ||
      null
    setForm(current => ({
      ...current,
      creative_template_id: template.id,
      creative_template_variant: variant?.id || '',
    }))
  }

  function updateImage(field, files, multiple = false) {
    setForm(current => ({
      ...current,
      images: {
        ...current.images,
        [field]: multiple ? Array.from(files || []) : files?.[0] || null,
      },
    }))
  }

  function updateTemplateField(field, value) {
    const key = formKeyForTemplateField(field)
    update(key, value)
    // Ao editar um campo destacado como faltante, tira o destaque (feedback imediato).
    setMissingKeys(prev => {
      if (!prev.has(key)) return prev
      const next = new Set(prev); next.delete(key); return next
    })
  }

  function templateFieldValue(field) {
    return form[formKeyForTemplateField(field)] ?? ''
  }

  function imageSlotCount(slot) {
    const value = form.images?.[slot.id]
    return slot.multiple ? (value?.length || 0) : value ? 1 : 0
  }

  function renderTemplateField(field) {
    const fieldKey = formKeyForTemplateField(field)
    const invalid = missingKeys.has(fieldKey)
    const commonProps = {
      id: fieldKey,
      value: templateFieldValue(field),
      onChange: event => updateTemplateField(field, event.target.value),
      className: `${inputClass}${invalid ? ' border-red-400/60' : ''}`,
      placeholder: field.placeholder || '',
      required: Boolean(field.required),
      maxLength: field.maxLength,
      autoComplete: 'off',
      'aria-invalid': invalid || undefined,
    }

    if (field.type === 'textarea' || field.type === 'list') {
      return (
        <>
          <textarea
            {...commonProps}
            className={`${inputClass} min-h-20 resize-y${invalid ? ' border-red-400/60' : ''}`}
          />
          {field.helper && <span className="mt-1.5 block text-[11px] leading-4 text-white/35">{field.helper}</span>}
        </>
      )
    }

    if (field.type === 'select') {
      return (
        <BrandedSelect
          value={commonProps.value}
          onChange={value => updateTemplateField(field, value)}
          options={field.options || []}
          placeholder={field.placeholder || 'Selecionar'}
        />
      )
    }

    return (
      <>
        <input {...commonProps} inputMode={field.type === 'money' ? 'text' : undefined} />
        {field.helper && <span className="mt-1.5 block text-[11px] leading-4 text-white/35">{field.helper}</span>}
      </>
    )
  }

  async function submit(event) {
    event.preventDefault()
    // Wizard: nos passos 1-2, submeter/Enter apenas AVANCA; validacao e criacao rodam no passo final.
    if (step < STEP_LABELS.length) { setStep(s => Math.min(s + 1, STEP_LABELS.length)); return }
    const productName = form.product_name.trim()
    if (!productName) {
      setLocalError('Informe o Nome do Produto no inicio do formulario para criar a campanha.')
      setMissingKeys(new Set(['product_name']))
      setStep(2)
      requestAnimationFrame(() => {
        const el = document.getElementById('product_name')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus?.()
      })
      return
    }

    // Fase 4 (UX): valida TODOS os obrigatorios de uma vez (antes era um por vez, .find), para o
    // operador corrigir tudo num passo so em vez de re-submeter campo a campo.
    const missingFieldObjs = selectedFieldGroups
      .flatMap(group => group.fields || [])
      .filter(field => field.required && !String(form[formKeyForTemplateField(field)] || '').trim())
    const missingFields = missingFieldObjs.map(field => field.label)

    // Fluxo so com upload manual: os slots de imagem obrigatorios sao sempre exigidos.
    const missingImageSlots = selectedImageSlots
      .filter(slot => slot.required && imageSlotCount(slot) === 0)
      .map(slot => slot.label)

    const allMissing = [...missingFields, ...missingImageSlots]
    if (allMissing.length) {
      setMissingKeys(new Set(missingFieldObjs.map(f => formKeyForTemplateField(f))))
      // Pula para o passo que contem o 1o campo faltante (campos = passo 2; imagens = passo 3).
      setStep(missingFieldObjs.length ? 2 : 3)
      const base = allMissing.length === 1
        ? `Preencha o campo obrigatorio: ${allMissing[0]}.`
        : `Preencha os ${allMissing.length} campos obrigatorios: ${allMissing.join(', ')}.`
      setLocalError(missingImageSlots.length
        ? `${base} Faca o upload das fotos do imovel.`
        : base)
      // Foco/scroll no 1o campo faltante — o operador cai no lugar certo em vez de cacar no scroll longo.
      const firstKey = missingFieldObjs[0] && formKeyForTemplateField(missingFieldObjs[0])
      if (firstKey) requestAnimationFrame(() => {
        const el = document.getElementById(firstKey)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus?.()
      })
      return
    }

    setMissingKeys(new Set())
    setLocalError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setLocalError(errorMessage(err))
    }
  }

  const inputClass = 'form-input'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'
  const sectionTitleClass = 'border-b border-white/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400'

  // Fechar com confirmacao quando ha edicao/copy IA: o <Modal> fecha por Esc/scrim; sem isto = perda acidental.
  function handleClose() {
    if (dirty && !window.confirm('Descartar esta campanha? Os dados preenchidos e a copy gerada por IA serao perdidos.')) return
    onClose()
  }

  return (
    <Modal
      open
      onClose={handleClose}
      title="Nova campanha"
      description={brandProfile.shortName}
      size="xl"
      footer={
        <div className="space-y-4">
          {(localError || submitError) && (
            <div className="rounded-lg border border-red-400/25 bg-red-950/30 px-4 py-3 text-xs leading-5 text-red-100/82" role="alert">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-300" aria-hidden="true" />
                <span>{localError || errorMessage(submitError)}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={step === 1 ? handleClose : () => setStep(s => Math.max(s - 1, 1))}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/65 transition hover:border-white/20 hover:text-white"
            >
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </button>
            {step < STEP_LABELS.length ? (
              <button
                type="button"
                onClick={() => setStep(s => Math.min(s + 1, STEP_LABELS.length))}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-[color:var(--surface-0)] transition hover:bg-gold-400"
              >
                Avançar
              </button>
            ) : (
              <button
                type="submit"
                form="new-campaign-form"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-[color:var(--surface-0)] transition hover:bg-gold-400 disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? 'Criando campanha…' : 'Criar Campanha'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <form id="new-campaign-form" onSubmit={submit} noValidate autoComplete="off" className="space-y-6">
        {/* Progresso do wizard — o operador ve em que passo esta, o que ja completou, e navega clicando. */}
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const active = step === n
            const done = step > n
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(n)}
                aria-current={active ? 'step' : undefined}
                className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${active ? 'border-gold-500/50 bg-gold-500/10' : done ? 'border-gold-500/20 bg-gold-500/[0.04]' : 'border-white/10 bg-white/[0.02]'}`}
              >
                <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${active || done ? 'bg-gold-500 text-[color:var(--surface-0)]' : 'bg-white/10 text-white/50'}`}>{done ? '✓' : n}</span>
                <span className={`text-2xs font-semibold uppercase tracking-[0.12em] ${active ? 'text-gold-100' : 'text-white/50'}`}>{label}</span>
              </button>
            )
          })}
        </div>

        <div className={step === 1 ? 'space-y-7' : 'hidden'}>
            <section className="space-y-4">
              <p className={sectionTitleClass}>Variacoes do criativo</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Variacoes por template aprovado" labelClass={labelClass}>
                  <BrandedSelect
                    value={form.creative_variations}
                    onChange={value => update('creative_variations', Number(value))}
                    options={CREATIVE_VARIATION_OPTIONS}
                  />
                  <span className="mt-1.5 block text-[11px] leading-4 text-white/35">
                    Layout, marca e formatos permanecem fixos; a ferramenta varia argumentos, fotos, copy e CTA permitidos pelo template.
                  </span>
                  {(() => {
                    const cap = distinctConceptCapacity(form, brandProfile)
                    const ads = Math.min(Number(form.creative_variations) || 0, cap)
                    const overflow = Number(form.creative_variations) > cap
                    return (
                      <>
                        <span className="mt-1.5 block text-[11px] font-semibold leading-4 text-gold-300/90">
                          Serao gerados {ads} anuncios &times; 3 formatos = {ads * 3} cortes (1:1, 9:16 e 1.91:1).
                        </span>
                        {overflow && (
                          <span className="mt-1 block text-[11px] leading-4 text-amber-300/80">
                            Este template tem {cap} angulos distintos — acima disso a copy se repetiria, entao o total foi limitado a {cap}.
                          </span>
                        )}
                      </>
                    )
                  })()}
                </Field>
              </div>
              <p className="text-xs leading-5 text-white/42">
                A ferramenta usa as fotos enviadas como materia-prima, gera as variacoes e deixa o pacote pronto para QA, aprovacao e exportacao. Publicacao com verba continua exigindo autorizacao humana.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">Catalogo de Templates</p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-white/35">{brandProfile.name}</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {templateOptions.map(template => {
                  const selected = selectedTemplate?.id === template.id
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className={`group overflow-hidden rounded-lg border text-left transition ${
                        selected
                          ? 'border-gold-500/70 bg-gold-500/12 shadow-[0_0_0_1px_rgba(196,148,42,0.18)]'
                          : 'border-white/10 bg-black/24 hover:border-gold-500/35 hover:bg-gold-500/6'
                      }`}
                    >
                      <div className="grid grid-cols-[118px_1fr] gap-0">
                        <div className="flex h-full min-h-[118px] items-center justify-center border-r border-white/10 bg-[color:var(--surface-0)]">
                          {template.preview ? (
                            <img
                              src={template.preview}
                              alt=""
                              className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center px-4">
                              <BrandHorizontalLogo brandScope={brandProfile.scope} className="scale-90" />
                            </div>
                          )}
                        </div>
                        <div className="flex min-h-[118px] flex-col justify-between p-4">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{template.name}</p>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-400/85">{template.shortName}</p>
                              </div>
                              <span className={`mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                selected ? 'border-gold-500/50 text-gold-200' : 'border-white/10 text-white/35'
                              }`}>
                                {selected ? 'Selecionado' : 'Escolher'}
                              </span>
                            </div>
                            <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/48">{template.bestFor}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {template.formats.map(format => (
                              <span key={format} className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-white/45">
                                {format}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedTemplate?.variants?.length > 1 && (
                <div className="inline-flex rounded-lg border border-white/10 bg-black/35 p-1">
                  {selectedTemplate.variants.map(variant => {
                    const selected = selectedTemplateVariant?.id === variant.id
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => update('creative_template_variant', variant.id)}
                        className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                          selected
                            ? 'bg-gold-500/18 text-gold-100'
                            : 'text-white/48 hover:bg-white/5 hover:text-white/70'
                        }`}
                      >
                        {variant.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {(() => {
                const refs = selectedTemplate ? referencesForTemplateVariant(selectedTemplate, selectedTemplateVariant?.id) : []
                if (!refs.length) return null
                const formatLabels = ['1:1 Feed', '9:16 Story', '1.91:1 Wide']
                return (
                  <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-400/85">
                        Preview do template{selectedTemplateVariant?.label ? ` · ${selectedTemplateVariant.label}` : ''}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">referencia aprovada</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {refs.slice(0, 3).map((src, index) => (
                        <div key={src} className="overflow-hidden rounded border border-white/10 bg-[color:var(--surface-0)]">
                          <div className="flex aspect-square items-center justify-center">
                            <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                          </div>
                          <span className="block bg-black/45 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
                            {formatLabels[index] || ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {selectedVariationContract && (
                <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-400/85">
                    Variacao controlada pelo template
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Pode variar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedVariationContract.mutableSlots || []).map(slot => (
                          <span key={slot} className="rounded border border-gold-500/25 bg-gold-500/10 px-2 py-1 text-[10px] font-semibold text-gold-100/80">
                            {humanizeSlot(slot)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Permanece fixo</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedVariationContract.lockedSlots || []).map(slot => (
                          <span key={slot} className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-white/45">
                            {humanizeSlot(slot)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {extractEnabled && (
              <section className="space-y-4 rounded-2xl border border-gold-400/25 bg-gold-400/[0.04] p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">Importar de um anúncio · IA</p>
                  <p className="mt-2 text-xs leading-5 text-white/50">
                    Cole um anúncio/briefing, <strong className="text-white/70">ou o link do imóvel</strong> no site da construtora. {aiCopyEnabled
                      ? <>A IA pode <strong className="text-white/70">só extrair os fatos</strong> — ou <strong className="text-white/70">extrair e já escrever a copy</strong> num passo só.</>
                      : <>A IA lê e <strong className="text-white/70">propõe</strong> os campos abaixo — só o que estiver no texto.</>} Você revisa tudo antes; nada é preenchido sem o seu clique.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={extract.url}
                      onChange={event => setExtract(state => ({ ...state, url: event.target.value }))}
                      className={`${inputClass} flex-1 min-w-[55%]`}
                      placeholder="Cole o link do imóvel no site da construtora (opcional)"
                    />
                    <button
                      type="button"
                      onClick={handleFetchListing}
                      disabled={extract.fetching || !extract.url.trim()}
                      className="shrink-0 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-200 transition hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {extract.fetching ? 'Lendo a página…' : 'Buscar do link'}
                    </button>
                  </div>
                  <p className="text-[11px] leading-4 text-white/35">
                    A IA lê a página oficial e preenche a caixa abaixo — você revisa antes de extrair. Sites em JavaScript podem não funcionar; nesse caso, cole o texto.
                  </p>
                </div>

                <textarea
                  value={extract.sourceText}
                  onChange={event => setExtract(state => ({ ...state, sourceText: event.target.value }))}
                  className={`${inputClass} min-h-28 resize-y`}
                  placeholder="Ex: Apartamento no Menino Deus, 2 dormitórios com suíte, 61m², churrasqueira e sacada. R$ 539 mil. Próximo ao Parque da Redenção... (ou use o link acima)"
                />

                {templateOptions.length > 1 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleSuggestTemplate}
                      disabled={suggest.loading || extract.loading || !extract.sourceText.trim()}
                      className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-gold-400/40 hover:text-gold-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggest.loading ? 'Analisando…' : '💡 Sugerir o template ideal'}
                    </button>
                    {suggest.error && (
                      <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{suggest.error}</p>
                    )}
                    {suggest.result && (() => {
                      const alreadySelected = form.creative_template_id === suggest.result.templateId
                      const confClass = suggest.result.confidence === 'high'
                        ? 'border-emerald-400/40 text-emerald-300'
                        : suggest.result.confidence === 'medium'
                          ? 'border-amber-400/40 text-amber-300'
                          : 'border-red-400/40 text-red-300'
                      return (
                        <div className="space-y-2 rounded-xl border border-gold-400/30 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400/85">Template recomendado</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${confClass}`}>{suggest.result.confidence}</span>
                          </div>
                          <p className="text-sm font-semibold text-white/90">{suggest.result.name}</p>
                          {suggest.result.rationale && <p className="text-[11px] leading-4 text-white/45">{suggest.result.rationale}</p>}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {alreadySelected ? (
                              <span className="text-[11px] font-medium text-emerald-300">✓ já é o template selecionado</span>
                            ) : (
                              <button type="button" onClick={applySuggestedTemplate} className="rounded-full bg-gold-400 px-3 py-1.5 text-[11px] font-semibold text-black transition hover:bg-gold-300">
                                Usar este template
                              </button>
                            )}
                            <button type="button" onClick={dismissSuggestion} className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/55 transition hover:text-white">
                              Dispensar
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {aiCopyEnabled && (
                    <button
                      type="button"
                      onClick={handleExtractAndGenerate}
                      disabled={extract.loading || aiCopy.loading || !extract.sourceText.trim()}
                      className="rounded-full bg-gold-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {extract.loading
                        ? (extract.phase === 'generating' ? 'Gerando copy…' : 'Extraindo…')
                        : '✨ Extrair e gerar copy'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExtractFacts}
                    disabled={extract.loading || !extract.sourceText.trim()}
                    className="rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-200 transition hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {extract.loading && !aiCopyEnabled ? 'Extraindo…' : (aiCopyEnabled ? 'Só extrair fatos' : 'Extrair fatos com IA')}
                  </button>
                  {(extract.result || extract.sourceText) && (
                    <button
                      type="button"
                      onClick={clearExtract}
                      disabled={extract.loading}
                      className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/55 transition hover:text-white disabled:opacity-50"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {extract.error && (
                  <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{extract.error}</p>
                )}

                {extract.applied && (
                  <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    <span>{extract.applied.keys.length} campo(s) preenchidos pela IA — revise abaixo antes de gerar.</span>
                    <button type="button" onClick={undoExtracted} className="font-semibold underline underline-offset-2 hover:text-emerald-200">Desfazer</button>
                  </p>
                )}

                {extract.result && (() => {
                  const entries = Object.entries(extract.result.fields).filter(([, f]) => f.present)
                  if (!entries.length) {
                    return <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45">A IA não encontrou dados ancorados no texto. Cole um anúncio mais completo e tente de novo.</p>
                  }
                  const labelByKey = {}
                  selectedFieldGroups.flatMap(g => g.fields || []).forEach(f => { labelByKey[formKeyForTemplateField(f)] = f.label })
                  return (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">{entries.length} campo(s) encontrados</span>
                        {!extract.applied && (
                          <div className="flex items-center gap-1 rounded-full border border-white/10 p-0.5">
                            {[['fill-empty', 'Preencher vazios'], ['overwrite', 'Sobrescrever']].map(([mode, label]) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setExtractMode(mode)}
                                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${extractMode === mode ? 'bg-gold-400 text-black' : 'text-white/50 hover:text-white'}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {entries.map(([key, f]) => {
                          const confClass = f.confidence === 'high'
                            ? 'border-emerald-400/40 text-emerald-300'
                            : f.confidence === 'medium'
                              ? 'border-amber-400/40 text-amber-300'
                              : 'border-red-400/40 text-red-300'
                          const value = Array.isArray(f.value) ? f.value.join(' · ') : f.value
                          return (
                            <div key={key} className="rounded-xl border border-white/10 bg-black/20 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{labelByKey[key] || key}</span>
                                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${confClass}`}>{f.confidence}</span>
                              </div>
                              <p className="mt-1.5 text-sm text-white/85">{value}</p>
                              {f.evidence && <p className="mt-1 text-[11px] italic leading-4 text-white/35">“{f.evidence}”</p>}
                              {Array.isArray(f.issues) && f.issues.length > 0 && (
                                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] leading-4 text-amber-300/80">
                                  {f.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {!extract.applied && (
                        <button
                          type="button"
                          onClick={applyExtracted}
                          className="rounded-full bg-gold-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-gold-300"
                        >
                          Aplicar ao formulário
                        </button>
                      )}
                    </div>
                  )
                })()}
              </section>
            )}
        </div>

        <div className={step === 2 ? 'space-y-7' : 'hidden'}>
            {selectedFieldGroups.map(group => (
              <section key={group.id} className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">{group.title}</p>
                  {group.description && <p className="mt-2 text-xs leading-5 text-white/42">{group.description}</p>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(group.fields || []).map(field => {
                    const key = formKeyForTemplateField(field)
                    const full = field.colSpan === 'full' || field.type === 'textarea' || field.type === 'list'
                    const aiFilled = aiFilledKeys.includes(key)
                    return (
                      <Field
                        key={`${group.id}-${field.key}`}
                        label={`${field.label}${field.required ? ' *' : ''}`}
                        labelClass={labelClass}
                        className={full ? 'md:col-span-2' : ''}
                      >
                        <div
                          className={`relative rounded-lg ${aiFilled ? 'ring-1 ring-gold-400/45' : ''}`}
                          aria-invalid={key === 'product_name' && Boolean(localError && !form.product_name.trim())}
                        >
                          {aiFilled && (
                            <button
                              type="button"
                              onClick={() => update(key, '')}
                              title="Preenchido pela IA — clique para limpar este campo"
                              className="absolute -top-2 right-2 z-10 rounded-full border border-gold-400/45 bg-[color:var(--surface-1)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-300 transition hover:text-gold-200"
                            >
                              IA ✕
                            </button>
                          )}
                          {renderTemplateField(field)}
                        </div>
                      </Field>
                    )
                  })}
                </div>
              </section>
            ))}

            {!selectedFieldGroups.length && (
              <>
            <section className="space-y-4">
              <p className={sectionTitleClass}>Dados do Produto</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do Produto" labelClass={labelClass}>
                  <input
                    value={form.product_name}
                    onChange={event => update('product_name', event.target.value)}
                    aria-invalid={Boolean(localError && !form.product_name.trim())}
                    className={inputClass}
                    placeholder="Ex: Lake Baikal"
                  />
                </Field>

                <Field label="Tagline / Empreendimento" labelClass={labelClass}>
                  <input
                    value={form.tagline}
                    onChange={event => update('tagline', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: GOLDEN LAKE · MULTIPLAN"
                  />
                </Field>

                <Field label="Localização" labelClass={labelClass}>
                  <input
                    value={form.location}
                    onChange={event => update('location', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: Orla do Guaíba, Porto Alegre"
                  />
                </Field>

                <Field label="Metragem" labelClass={labelClass}>
                  <input
                    value={form.area}
                    onChange={event => update('area', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: 195 a 250 m²"
                  />
                </Field>

                <Field label="Suítes" labelClass={labelClass}>
                  <input
                    value={form.suites}
                    onChange={event => update('suites', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: 4 suítes"
                  />
                </Field>

                <Field label="Andares / Torres" labelClass={labelClass}>
                  <input
                    value={form.towers}
                    onChange={event => update('towers', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: 2 torres de 30 pavimentos"
                  />
                </Field>

                <Field label="Diferenciais" labelClass={labelClass}>
                  <textarea
                    value={form.differentials}
                    onChange={event => update('differentials', event.target.value)}
                    className={`${inputClass} min-h-20 resize-y`}
                    placeholder="Ex: Beach Club, Lago cristalino, Spa, Piscina térmica"
                  />
                </Field>

                <Field label="Preço" labelClass={labelClass}>
                  <input
                    value={form.price}
                    onChange={event => update('price', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: R$ 3M"
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <p className={sectionTitleClass}>Textos Base</p>
              <Field label="Headline sugerida" labelClass={labelClass}>
                <input
                  value={form.suggested_headline}
                  onChange={event => update('suggested_headline', event.target.value)}
                  className={inputClass}
                  placeholder="Ex: O próximo capítulo de sofisticação na Orla"
                />
              </Field>

              <Field label="Copy sugerida" labelClass={labelClass}>
                <textarea
                  value={form.suggested_copy}
                  onChange={event => update('suggested_copy', event.target.value)}
                  className={`${inputClass} min-h-20 resize-y`}
                  placeholder="Ex: 2 torres de 30 pavimentos. Residências de 195 a 250 m² com 4 suítes."
                />
              </Field>

              <Field label="CTA padrão" labelClass={labelClass}>
                <input
                  value={form.cta}
                  onChange={event => update('cta', event.target.value)}
                  className={inputClass}
                  placeholder="Ex: Conheça o projeto"
                />
              </Field>
            </section>
              </>
            )}

            {aiCopyEnabled && (
              <section ref={copyPanelRef} className="space-y-4 rounded-2xl border border-gold-400/25 bg-gold-400/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">Copiloto de copy · IA</p>
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      Gera ângulos de copy na voz da {brandProfile.name} a partir dos dados acima. Você revisa, edita e aprova — nada vai pro ar sem o seu OK.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateCopy}
                    disabled={aiCopy.loading || extract.loading}
                    className="shrink-0 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-200 transition hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiCopy.loading ? 'Gerando…' : aiCopy.drafts ? 'Gerar de novo' : 'Gerar copy com IA'}
                  </button>
                </div>

                {aiCopy.error && (
                  <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{aiCopy.error}</p>
                )}

                {aiApplied && (
                  <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    {form.ai_copy_angles.length} ângulo(s) de IA aplicados — as variações usarão estes textos. Edite e clique em “Usar estes ângulos” de novo para atualizar.
                  </p>
                )}

                {Array.isArray(aiCopy.drafts) && aiCopy.drafts.length > 0 && (
                  <div className="space-y-4">
                    {aiCopy.drafts.map((draft, index) => (
                      <div key={draft.key || index} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">
                            {draft.angle || `Ângulo ${index + 1}`}
                          </span>
                          {Array.isArray(draft.issues) && draft.issues.length > 0 && (
                            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              {draft.issues.length} ajuste(s) sugerido(s)
                            </span>
                          )}
                        </div>
                        <Field label="Headline" labelClass={labelClass}>
                          <input
                            value={draft.headline || ''}
                            onChange={event => editDraft(index, 'headline', event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Texto" labelClass={labelClass}>
                          <textarea
                            value={draft.body || ''}
                            onChange={event => editDraft(index, 'body', event.target.value)}
                            className={`${inputClass} min-h-16 resize-y`}
                          />
                        </Field>
                        <Field label="CTA" labelClass={labelClass}>
                          <input
                            value={draft.cta || ''}
                            onChange={event => editDraft(index, 'cta', event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                        {Array.isArray(draft.issues) && draft.issues.length > 0 && (
                          <ul className="list-disc space-y-1 pl-4 text-[11px] leading-4 text-amber-300/80">
                            {draft.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={applyAiDrafts}
                        className="rounded-full bg-gold-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-gold-300"
                      >
                        Usar estes ângulos
                      </button>
                      <button
                        type="button"
                        onClick={clearAiCopy}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/55 transition hover:text-white"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
        </div>

        <div className={step === 3 ? 'space-y-7' : 'hidden'}>
            <section className="space-y-4">
              <p className={sectionTitleClass}>Upload de Imagens</p>
              <div className="grid gap-3 md:grid-cols-2">
                {selectedImageSlots.map(field => {
                  const count = imageSlotCount(field)
                  const emptyLabel = field.multiple ? '+ Upload (múltiplas)' : '+ Upload'
                  return (
                    <label
                      key={field.id}
                      className="cursor-pointer rounded-lg border border-dashed border-gold-500/25 bg-gold-500/5 p-4 transition hover:border-gold-500/50 hover:bg-gold-500/10"
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">{field.label}{field.required ? ' *' : ''}</span>
                      <span className="mt-3 block text-center text-xs font-semibold text-gold-400">
                        {count ? `${count} arquivo${count > 1 ? 's' : ''}` : emptyLabel}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple={field.multiple}
                        onChange={event => updateImage(field.id, event.target.files, field.multiple)}
                        className="sr-only"
                      />
                    </label>
                  )
                })}
              </div>
            </section>
        </div>
      </form>
    </Modal>
  )
}

function BrandedSelect({ value, options = [], onChange, placeholder = 'Selecionar', disabled = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const normalizedOptions = options.map(option => (
    typeof option === 'string' ? { value: option, label: option } : option
  ))
  const selectedOption = normalizedOptions.find(option => String(option.value) === String(value))

  useEffect(() => {
    if (!open) return undefined

    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    window.addEventListener('pointerdown', closeOnOutsideClick)
    return () => window.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  function choose(optionValue) {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        onKeyDown={event => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gold-500/25 disabled:cursor-not-allowed disabled:opacity-55 ${
          open
            ? 'border-gold-500/65 bg-[color:var(--surface-0)] text-gold-50 shadow-[0_0_0_1px_rgba(196,148,42,0.18)]'
            : 'border-white/10 bg-black/35 text-white hover:border-gold-500/38 hover:bg-[color:var(--surface-0)]'
        }`}
      >
        <span className={selectedOption ? 'truncate text-white' : 'truncate text-white/30'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gold-300/80 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-64 overflow-y-auto rounded-lg border border-gold-500/35 bg-[color:var(--surface-0)] py-1 shadow-2xl shadow-black/80"
        >
          {normalizedOptions.map(option => {
            const selected = String(option.value) === String(value)
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(option.value)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition focus:outline-none ${
                  selected
                    ? 'bg-gold-500/18 text-gold-100'
                    : 'text-white/72 hover:bg-white/[0.055] hover:text-white focus:bg-white/[0.055] focus:text-white'
                }`}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {selected && <Check size={14} className="shrink-0 text-gold-300" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
