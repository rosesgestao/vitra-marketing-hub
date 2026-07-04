// Painel "Revisar e publicar" do Tráfego Pago: monta a campanha Meta (campanha → conjunto → criativo →
// anúncio) em PAUSED via Edge publish-meta-ads (geo, direcionamento, plataformas, públicos, orçamento).
// Ativar (gastar) é ação SEPARADA, com window.confirm. Extraído de PremiumDashboard.jsx (Onda 4).

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Loader2, MapPin, Users, RotateCcw, Wand2, Megaphone } from 'lucide-react'
import VitraSelect from './VitraSelect.jsx'
import { BRAND_SCOPES } from '../lib/brandProfiles.js'
import { evaluateMetaAdReadiness, assetPublishReady } from '../lib/metaAdReadiness.js'
import { errorMessage } from '../lib/errorMessage.js'
import {
  META_AD_ACCOUNTS,
  DEFAULT_OBJECTIVE,
  META_OBJECTIVE_OPTIONS,
  REGIONAL_RADIUS_MAX_KM,
  DETAILED_TARGETING_PRESETS,
  detailedTargetingPreset,
  PLACEMENT_PRESETS,
  placementPreset,
  geocodeAddress,
  buildGeoAdSets,
  saveCampaignGeo,
  estimateAudience,
  listMetaAdAccounts,
  listMetaPages,
  listMetaPixels,
  suggestMetaAudiences,
  listMetaAudiences,
  createWebsiteAudience,
  createLookalikeAudience,
  buildMetaDraft,
  activateMetaCampaign,
} from '../lib/premiumData.js'

export function PublishMetaPanel({ campaign, brandProfile, ads, seed }) {
  const readyAds = ads.filter(ad => evaluateMetaAdReadiness(ad).ok).length
  const intake = campaign?.brief?.source_intake || {}
  const acct = META_AD_ACCOUNTS[brandProfile.scope] || META_AD_ACCOUNTS[BRAND_SCOPES.imobiliaria] || {}
  const [adAccountId, setAdAccountId] = useState(acct.adAccountId || '')
  const [pageId, setPageId] = useState('')
  const [destination, setDestination] = useState(intake.whatsapp_url || intake.landing_url || intake.url || '')
  const [budget, setBudget] = useState('20')
  const [creativesPerAdset, setCreativesPerAdset] = useState(3)   // anuncios por conjunto (3x3 da vencedora)
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [proposal, setProposal] = useState([])
  const [suggesting, setSuggesting] = useState(false)
  const [audiences, setAudiences] = useState([])
  const [audBusy, setAudBusy] = useState(false)
  const [audMsg, setAudMsg] = useState(null)
  const [pixelId, setPixelId] = useState('')
  const [lkOrigin, setLkOrigin] = useState('')
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE)
  const [privacyUrl, setPrivacyUrl] = useState('')
  const [pixels, setPixels] = useState([])
  const [convPixelId, setConvPixelId] = useState('')
  const [conversionEvent, setConversionEvent] = useState('LEAD')
  const [metaAccounts, setMetaAccounts] = useState([])
  const [metaPages, setMetaPages] = useState([])
  const [connMsg, setConnMsg] = useState(null)   // aviso quando a auto-descoberta de conta/Página falha (cai no ID manual)
  // Localização (2 conjuntos): endereço do imóvel -> geocodificação -> raio <= 2km + Porto Alegre (cidade).
  const gt0 = campaign?.brief?.geo_target || {}
  const pd0 = campaign?.brief?.product_data || {}
  const [addr, setAddr] = useState(gt0.address || pd0.location || pd0.neighborhood || '')
  const [geoLat, setGeoLat] = useState(gt0.lat != null ? String(gt0.lat) : '')
  const [geoLng, setGeoLng] = useState(gt0.lng != null ? String(gt0.lng) : '')
  const [geoLabel, setGeoLabel] = useState(gt0.label || '')
  const [radiusKm, setRadiusKm] = useState(gt0.radius_km || REGIONAL_RADIUS_MAX_KM)
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoMsg, setGeoMsg] = useState(null)
  const geoHasPoint = Number.isFinite(Number(geoLat)) && String(geoLat).trim() !== '' && Number.isFinite(Number(geoLng)) && String(geoLng).trim() !== ''

  async function handleGeocode() {
    if (!addr.trim()) { setGeoMsg({ kind: 'err', text: 'Informe o endereço do imóvel.' }); return }
    setGeoBusy(true); setGeoMsg(null)
    try {
      const r = await geocodeAddress(addr.trim())
      if (r?.found) { setGeoLat(String(r.lat)); setGeoLng(String(r.lng)); setGeoLabel(r.label || ''); setGeoMsg({ kind: 'ok', text: 'Endereço localizado — confira o pino e o raio, ou ajuste as coordenadas.' }) }
      else { setGeoMsg({ kind: 'warn', text: r?.message || 'Endereço não encontrado. Ajuste lat/lng manualmente.' }) }
    } catch (e) { setGeoMsg({ kind: 'err', text: errorMessage(e) }) } finally { setGeoBusy(false) }
  }
  function applyGeoAdSets() {
    const lat = Number(geoLat), lng = Number(geoLng)
    const sets = buildGeoAdSets({ lat, lng, radiusKm: Number(radiusKm) })
    setProposal(sets)
    setGeoMsg({ kind: 'ok', text: geoHasPoint ? '2 conjuntos definidos: Região do imóvel + Porto Alegre.' : 'Sem coordenadas: só o conjunto de Porto Alegre foi definido.' })
    saveCampaignGeo(campaign.id, {
      address: addr.trim() || null, label: geoLabel || null,
      lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null,
      radius_km: Math.min(REGIONAL_RADIUS_MAX_KM, Number(radiusKm) || REGIONAL_RADIUS_MAX_KM),
    }).catch(() => setGeoMsg({ kind: 'warn', text: 'Conjuntos definidos, mas não consegui salvar a geolocalização — ela vale só nesta sessão (recarregar pode perder). Você pode aplicar de novo.' }))
  }

  // Direcionamento detalhado (interesses) — padrão = preset "Intenção imobiliária (núcleo)", advantage 1.
  const DT_DEFAULT = DETAILED_TARGETING_PRESETS[0]
  const [dtPresetKey, setDtPresetKey] = useState(DT_DEFAULT.key)
  const [dtInterests, setDtInterests] = useState(DT_DEFAULT.interests)         // [{id,name,tier}]
  const [dtAdvantage, setDtAdvantage] = useState(DT_DEFAULT.advantage_audience) // 1 = expansão (referência)
  const [dtExtra, setDtExtra] = useState('')                                    // interesses extras por nome (busca no build)
  function applyDetailedPreset(key) {
    const p = detailedTargetingPreset(key) || DT_DEFAULT
    setDtPresetKey(p.key); setDtInterests(p.interests); setDtAdvantage(p.advantage_audience)
  }
  function removeDtInterest(id) {
    if (detailedTargetingPreset(dtPresetKey)?.interests.find(i => i.id === id)?.tier === 'core') return // núcleo obrigatório
    setDtInterests(prev => prev.filter(i => i.id !== id))
  }
  // Estimativa qualitativa de alcance (sem chamar reachestimate): combina expansão + nº de interesses + geo.
  function audienceEstimate() {
    if (dtAdvantage === 1) return { label: 'Amplo', cls: 'text-emerald-300', hint: 'Advantage ligado: a Meta expande além dos interesses (como a vencedora).' }
    const n = dtInterests.length
    if (n <= 3) return { label: 'Específico', cls: 'text-amber-300', hint: 'Poucos interesses e sem expansão — público mais estreito.' }
    return { label: 'Médio', cls: 'text-white/70', hint: 'Sem expansão; o público é a soma dos interesses selecionados.' }
  }
  const dtExtraList = dtExtra.split(',').map(s => s.trim()).filter(Boolean)
  // Estimativa NUMÉRICA real (delivery_estimate da Meta) por conjunto de geografia.
  const [estimate, setEstimate] = useState({ loading: false, error: null, rows: null })
  const fmtReach = (n) => n == null ? '—' : (n >= 1e6 ? `${(n / 1e6).toFixed(1)} mi` : n >= 1e3 ? `${Math.round(n / 1e3)} mil` : String(n))
  async function handleEstimate() {
    setEstimate({ loading: true, error: null, rows: null })
    try {
      const interestIds = dtInterests.map(i => ({ id: i.id }))
      const base = proposal.length ? proposal : buildGeoAdSets({ lat: Number(geoLat), lng: Number(geoLng), radiusKm: Number(radiusKm) })
      const specs = base
        .filter(s => !s.retargeting && !s.custom_audience_id && !(Array.isArray(s.custom_audience_ids) && s.custom_audience_ids.length))
        .map(s => ({ ...s, interest_ids: interestIds, advantage_audience: dtAdvantage }))
      const rows = []
      for (const s of specs) {
        const r = await estimateAudience({ adAccountId, objective, spec: s })
        rows.push({ label: s.label || (s.geo === 'radius' ? 'Região do imóvel' : 'Porto Alegre'), lower: r?.lower ?? null, upper: r?.upper ?? null, ok: !!r?.ok })
      }
      setEstimate({ loading: false, error: null, rows })
    } catch (e) { setEstimate({ loading: false, error: errorMessage(e), rows: null }) }
  }

  // Posicionamentos manuais (Frente 2). Catálogo de plataformas + posições (rótulos PT + enum da Meta).
  // `incompat` = posição que NÃO casa com os formatos Feed 4:5 / Story 9:16 (exigiria outra arte).
  const PLATFORM_META = [
    { key: 'facebook', label: 'Facebook', positions: [
      { id: 'feed', label: 'Feed' }, { id: 'marketplace', label: 'Marketplace' }, { id: 'story', label: 'Stories' },
      { id: 'facebook_reels', label: 'Reels' }, { id: 'profile_feed', label: 'Feed do perfil' },
      { id: 'right_hand_column', label: 'Coluna da direita', incompat: true }, { id: 'instream_video', label: 'Vídeos in-stream', incompat: true }, { id: 'search', label: 'Resultados de pesquisa', incompat: true } ] },
    { key: 'instagram', label: 'Instagram', positions: [
      { id: 'stream', label: 'Feed' }, { id: 'story', label: 'Stories' }, { id: 'explore', label: 'Explorar' },
      { id: 'reels', label: 'Reels' }, { id: 'profile_feed', label: 'Feed do perfil' },
      { id: 'ig_search', label: 'Pesquisa', incompat: true } ] },
    { key: 'messenger', label: 'Messenger', positions: [
      { id: 'messenger_home', label: 'Caixa de entrada' }, { id: 'story', label: 'Stories' } ] },
    { key: 'audience_network', label: 'Audience Network', positions: [
      { id: 'classic', label: 'Aplicativos e sites' }, { id: 'rewarded_video', label: 'Vídeos premiados', incompat: true } ] },
  ]
  const PL_DEFAULT = PLACEMENT_PRESETS[0]
  const plStateFromPreset = (p) => ({
    platforms: new Set(p.advantage_plus ? [] : (p.publisher_platforms || [])),
    positions: {
      facebook: [...(p.facebook_positions || [])], instagram: [...(p.instagram_positions || [])],
      messenger: [...(p.messenger_positions || [])], audience_network: [...(p.audience_network_positions || [])],
    },
    advantagePlus: !!p.advantage_plus,
  })
  const plInit = plStateFromPreset(PL_DEFAULT)
  const [plPresetKey, setPlPresetKey] = useState(PL_DEFAULT.key)
  const [plPlatforms, setPlPlatforms] = useState(plInit.platforms)
  const [plPositions, setPlPositions] = useState(plInit.positions)
  const [plAdvantagePlus, setPlAdvantagePlus] = useState(plInit.advantagePlus)
  function applyPlacementPreset(key) {
    const p = placementPreset(key) || PL_DEFAULT
    const st = plStateFromPreset(p)
    setPlPresetKey(p.key); setPlPlatforms(st.platforms); setPlPositions(st.positions); setPlAdvantagePlus(st.advantagePlus)
  }
  function togglePlatform(pf) {
    setPlAdvantagePlus(false)
    setPlPlatforms(prev => { const n = new Set(prev); n.has(pf) ? n.delete(pf) : n.add(pf); return n })
  }
  function togglePosition(pf, pos) {
    setPlAdvantagePlus(false)
    setPlPlatforms(prev => prev.has(pf) ? prev : new Set(prev).add(pf))
    setPlPositions(prev => {
      const cur = prev[pf] || []; const next = cur.includes(pos) ? cur.filter(x => x !== pos) : [...cur, pos]
      return { ...prev, [pf]: next }
    })
  }
  // Monta o recorte de posicionamentos para o build. Advantage+ => {} (omite = Meta otimiza tudo).
  function placementSpec() {
    if (plAdvantagePlus || plPlatforms.size === 0) return {}
    const plats = [...plPlatforms]
    const out = { publisher_platforms: plats }
    const map = { facebook: 'facebook_positions', instagram: 'instagram_positions', messenger: 'messenger_positions', audience_network: 'audience_network_positions' }
    for (const pf of plats) { const arr = plPositions[pf] || []; if (arr.length) out[map[pf]] = arr }
    return out
  }
  // Avisos: incompatíveis com os formatos, entrega restrita, AN/Messenger ligados.
  function placementWarnings() {
    const w = []
    if (plAdvantagePlus) { w.push({ kind: 'info', text: 'Advantage+ posicionamentos: a Meta distribui em TODOS os locais (inclui Messenger e Audience Network).' }); return w }
    const incompat = []
    for (const pf of plPlatforms) for (const pos of (plPositions[pf] || [])) {
      const meta = PLATFORM_META.find(x => x.key === pf)?.positions.find(x => x.id === pos)
      if (meta?.incompat) incompat.push(`${PLATFORM_META.find(x => x.key === pf)?.label}: ${meta.label}`)
    }
    if (incompat.length) w.push({ kind: 'warn', text: `Posicionamento sem arte compatível (precisa de outro formato): ${incompat.join(' · ')}.` })
    const totalPos = [...plPlatforms].reduce((n, pf) => n + (plPositions[pf]?.length || 0), 0)
    if (plPlatforms.size === 0) w.push({ kind: 'warn', text: 'Nenhuma plataforma selecionada — a entrega fica bloqueada.' })
    else if (totalPos > 0 && totalPos < 2) w.push({ kind: 'warn', text: 'Pouquíssimos posicionamentos — entrega muito restrita, pode encarecer o lead.' })
    if (plPlatforms.has('audience_network')) w.push({ kind: 'info', text: 'Audience Network costuma trazer cliques baratos e de menor qualidade para lead.' })
    if (plPlatforms.has('messenger')) w.push({ kind: 'info', text: 'Messenger raramente ajuda em formulário de lead.' })
    return w
  }

  // Auto-descoberta das contas de anuncio acessiveis (sem digitar ID). Pre-seleciona a conta da marca.
  useEffect(() => {
    let alive = true
    listMetaAdAccounts()
      .then(list => {
        if (!alive) return
        setMetaAccounts(list)
        setConnMsg(null)
        if (!adAccountId && list.length) {
          const brandAcct = list.find(a => a.id === acct.adAccountId) || list[0]
          setAdAccountId(brandAcct.id)
        }
      })
      .catch(() => setConnMsg({ kind: 'warn', text: 'Não consegui listar as contas de anúncio automaticamente (sem permissão/token neste ambiente). Digite o ID da conta manualmente abaixo (act_…).' }))
    return () => { alive = false }
  }, [])

  // Ao escolher a conta, carrega as Paginas promoveis dela e pre-seleciona a Pagina da MARCA da campanha
  // (quando a conta lista mais de uma marca — ex.: apos atribuir a Pagina Premium, a conta passa a trazer
  // Imobiliaria + Premium). Evita pre-selecionar a marca errada e cair no guard de marca.
  useEffect(() => {
    if (!adAccountId) { setMetaPages([]); return }
    let alive = true
    listMetaPages(adAccountId)
      .then(list => {
        if (!alive) return
        setMetaPages(list)
        setConnMsg(null)
        if (list.length && !list.some(p => p.id === pageId)) {
          const isPremium = brandProfile.scope === BRAND_SCOPES.premium
          const match = list.find(p => /premium/i.test(p.name || '') === isPremium)
          setPageId((match || list[0]).id)
        }
      })
      .catch(() => setConnMsg({ kind: 'warn', text: 'Não consegui listar as Páginas desta conta. Digite o ID da Página do Facebook manualmente abaixo.' }))
    return () => { alive = false }
  }, [adAccountId])
  // Auto-seed a partir de um PRESET ("Usar preset" no painel de Presets): aplica objetivo, orcamento e os
  // 2 conjuntos por geografia (regional por raio + cidade) como proposta a revisar. O operador confere e
  // gera o rascunho PAUSED. So semeia campos do padrao; criativo/Pagina/destino seguem do fluxo normal.
  useEffect(() => {
    if (!seed) return
    if (seed.objective === 'OUTCOME_LEADS') setObjective('leads_form')
    else if (seed.objective === 'OUTCOME_SALES') setObjective('sales')
    if (seed.daily_budget_cents) setBudget(String(seed.daily_budget_cents / 100))
    const specs = (Array.isArray(seed.adsets) ? seed.adsets : []).map(a => ({
      label: a.kind === 'regional' ? `Regional (raio ${a.radius_km || 2}km)` : 'Cidade (POA)',
      geo: a.geo,
      lat: a.lat ?? undefined, lng: a.lng ?? undefined,
      radius_km: a.radius_km ?? undefined, city_key: a.city_key ?? undefined,
      age_min: seed.age_min, age_max: seed.age_max,
      placements: 'facebook,instagram',
    }))
    if (specs.length) setProposal(specs)
  }, [seed])

  const isLeadForm = objective === 'leads_form'
  const isSales = objective === 'sales'

  const budgetCents = Math.round(Number(String(budget).replace(',', '.')) * 100) || 0

  // Prontidao de PUBLICACAO = contrato REAL do build_draft, pela FONTE ÚNICA `assetPublishReady`
  // (mesma exigência de campos que o QA do card usa — não podem mais divergir). O QA-polish completo
  // (evaluateMetaAdReadiness) é mais estrito: também pede os 3 cortes + foto de origem + UTM por anúncio.
  // Conta/pagina/destino/orcamento vem deste painel.
  const publishableAssets = ads
    .flatMap(ad => ad.assets || [])
    .filter(assetPublishReady).length

  // Lista EXATA do que falta para liberar o botao (em vez de desabilitar sem explicacao).
  const missingToBuild = []
  if (!adAccountId) missingToBuild.push('selecione a conta de anúncio')
  if (!pageId) missingToBuild.push('selecione a Página do Facebook')
  if (!destination) missingToBuild.push('informe o destino (site ou WhatsApp)')
  if (budgetCents < 100) missingToBuild.push('defina o orçamento diário (mínimo R$ 1,00)')
  if (isSales && !convPixelId) missingToBuild.push('selecione o pixel de conversão (objetivo Vendas)')
  if (publishableAssets < 1) missingToBuild.push('aprove ao menos 1 criativo renderizado com título, texto principal, descrição e CTA (use "Gerar 3 ângulos" no anúncio para preencher tudo)')

  const canBuild = missingToBuild.length === 0 && !loading

  async function handleBuild() {
    setLoading(true); setError(null)
    try {
      // Direcionamento detalhado: aplica os interesses (ids pré-resolvidos + extras por nome) e a expansão
      // Advantage aos conjuntos por GEOGRAFIA (não a conjuntos de retarget/público custom, que já se definem).
      const interestIds = dtInterests.map(i => ({ id: i.id, name: i.name }))
      const place = placementSpec()   // {} = Advantage+ (Meta otimiza tudo); senão publisher_platforms + *_positions
      const advAll = plAdvantagePlus || plPlatforms.size === 0
      const adSets = proposal.map(s => {
        if (s.retargeting || s.custom_audience_id || (Array.isArray(s.custom_audience_ids) && s.custom_audience_ids.length)) return s
        const base = { ...s, interest_ids: interestIds, interest_keywords: [...(s.interest_keywords || []), ...dtExtraList], advantage_audience: dtAdvantage }
        // Advantage+: omite plataformas E neutraliza o `placements` coarse (senão o parser forçaria FB+IG).
        if (advAll) return { ...base, placements: 'automatic', publisher_platforms: undefined, facebook_positions: undefined, instagram_positions: undefined, messenger_positions: undefined, audience_network_positions: undefined }
        return { ...base, ...place }
      })
      const data = await buildMetaDraft(campaign.id, { adAccountId, pageId, dailyBudgetCents: budgetCents, destinationUrl: destination, privacyPolicyUrl: privacyUrl, pixelId: convPixelId, conversionEvent, adSets, objective, creativesPerAdset })
      setResult(data)
    } catch (e) { setError(e) } finally { setLoading(false) }
  }
  async function handleLoadPixels() {
    setError(null)
    try { const px = await listMetaPixels(adAccountId); setPixels(px); if (px[0] && !convPixelId) setConvPixelId(px[0].id) }
    catch (e) { setError(e) }
  }
  async function handleSuggest() {
    setSuggesting(true); setError(null)
    try { setProposal(await suggestMetaAudiences(campaign.id, objective)) }
    catch (e) { setError(e) } finally { setSuggesting(false) }
  }
  async function handleListAudiences() {
    setAudBusy(true); setError(null); setAudMsg(null)
    try { const a = await listMetaAudiences(adAccountId); setAudiences(a); setAudMsg(`${a.length} público(s) na conta.`) }
    catch (e) { setError(e) } finally { setAudBusy(false) }
  }
  async function handleCreateWebsite() {
    setAudBusy(true); setError(null); setAudMsg(null)
    try { const r = await createWebsiteAudience(adAccountId, { name: `Visitantes do site — ${campaign.name}`.slice(0, 90), pixelId }); setAudMsg(`Público de site criado (${r.audience_id}).`); await handleListAudiences() }
    catch (e) { setError(e) } finally { setAudBusy(false) }
  }
  async function handleCreateLookalike() {
    setAudBusy(true); setError(null); setAudMsg(null)
    try { const r = await createLookalikeAudience(adAccountId, { name: `Semelhante — ${campaign.name}`.slice(0, 90), originAudienceId: lkOrigin }); setAudMsg(`Lookalike criado (${r.audience_id}).`); await handleListAudiences() }
    catch (e) { setError(e) } finally { setAudBusy(false) }
  }
  function assignAudience(i, id) {
    setProposal(prev => prev.map((x, idx) => (idx === i ? { ...x, custom_audience_id: id || undefined } : x)))
  }
  async function handleActivate() {
    if (!result?.meta_campaign_id) return
    const ok = window.confirm(`Ativar a campanha na Meta? A partir daqui ela passa a GASTAR ate R$ ${budget}/dia. Confirmacao do operador.`)
    if (!ok) return
    setActivating(true); setError(null)
    try {
      const data = await activateMetaCampaign(campaign.id)
      setResult(r => ({ ...r, activated: data.activated }))
    } catch (e) { setError(e) } finally { setActivating(false) }
  }

  return (
    <div className="rounded-xl border border-gold-500/25 bg-[color:var(--surface-1)] p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-px w-7 bg-gold-500/70" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">Revisar e publicar</p>
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight text-white">Publicar na Meta (rascunho pausado)</h3>
      <p className="mt-1.5 max-w-2xl text-xs leading-5 text-white/50">
        O agente monta campanha → conjunto → criativo → anúncio na sua conta, <span className="text-white/75">tudo pausado</span>. Objetivo <span className="text-white/75">Leads</span>, posicionamentos automáticos, orçamento com o <span className="text-white/75">teto que você define</span>. Nada gasta até você ativar.
      </p>

      <div className="mt-4 flex items-center gap-2 text-xs">
        {publishableAssets > 0
          ? (<><CheckCircle2 size={14} className="text-emerald-300" /><span className="text-white/70">{publishableAssets} criativo(s) aprovado(s) e renderizado(s) — prontos para publicar{readyAds > 0 ? '' : ' (alguns itens de QA opcionais ainda pendentes)'}</span></>)
          : (<><AlertTriangle size={14} className="text-amber-300" /><span className="text-white/55">Aprove ao menos 1 criativo renderizado (com título, texto e CTA) para liberar a publicação.</span></>)}
      </div>

      <div className="mt-4">
        <span className="form-label">Objetivo da campanha</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {META_OBJECTIVE_OPTIONS.map(o => (
            <button
              key={o.key}
              type="button"
              onClick={() => o.available && setObjective(o.key)}
              disabled={!o.available}
              title={o.available ? '' : o.hint}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${objective === o.key ? 'border-gold-500/55 bg-gold-500/15 text-gold-200' : o.available ? 'border-white/10 text-white/60 hover:text-white' : 'cursor-not-allowed border-white/5 text-white/25'}`}
            >
              {o.label}{o.available ? '' : ' 🔒'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Conta de anúncio</span>
          {metaAccounts.length ? (
            <VitraSelect value={adAccountId} onChange={setAdAccountId} placeholder="Selecione a conta" ariaLabel="Conta de anúncio"
              options={metaAccounts.map(a => ({ value: a.id, label: `${a.name || a.id}${a.currency ? ` · ${a.currency}` : ''}` }))} />
          ) : (
            <input className="form-input" value={adAccountId} onChange={e => setAdAccountId(e.target.value)} placeholder="ID da conta" />
          )}
        </label>
        <label className="block">
          <span className="form-label">Página (Facebook)</span>
          {metaPages.length ? (
            <VitraSelect value={pageId} onChange={setPageId} placeholder="Selecione a página" ariaLabel="Página"
              options={metaPages.map(p => ({ value: p.id, label: p.name || p.id }))} />
          ) : (
            <input className="form-input" value={pageId} onChange={e => setPageId(e.target.value)} placeholder="ID da Página" />
          )}
        </label>
        <label className="block"><span className="form-label">Teto de orçamento (R$/dia)</span><input className="form-input" inputMode="decimal" value={budget} onChange={e => setBudget(e.target.value)} /></label>
        <label className="block"><span className="form-label">Destino (site ou WhatsApp)</span><input className="form-input" value={destination} onChange={e => setDestination(e.target.value)} placeholder="https://… ou https://wa.me/55…" /></label>
        <label className="block"><span className="form-label">Criativos por conjunto</span>
          <VitraSelect value={String(creativesPerAdset)} onChange={v => setCreativesPerAdset(Number(v))} ariaLabel="Criativos por conjunto"
            options={[{ value: '1', label: '1 criativo' }, { value: '2', label: '2 criativos' }, { value: '3', label: '3 criativos (padrão)' }, { value: '4', label: '4 criativos' }]} />
          <span className="mt-1 block text-[10px] text-white/35">1 anúncio por criativo aprovado em cada conjunto (até o nº escolhido).</span>
        </label>
      </div>
      {connMsg && (
        <p className={`mt-2 flex items-start gap-1.5 text-[11px] leading-4 ${connMsg.kind === 'warn' ? 'text-amber-300' : 'text-white/50'}`}>
          <AlertTriangle size={13} className="mt-px shrink-0" />{connMsg.text}
        </p>
      )}

      {isLeadForm && (
        <label className="mt-3 block">
          <span className="form-label">Política de Privacidade (URL)</span>
          <input className="form-input" value={privacyUrl} onChange={e => setPrivacyUrl(e.target.value)} placeholder="https://… (exigida pela Meta no formulário; usa o destino se vazio)" />
          <span className="mt-1 block text-[11px] text-white/40">Formulário instantâneo com nome, e-mail e telefone. O ToS de Lead da Página é validado no momento de criar o rascunho.</span>
        </label>
      )}

      {isSales && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="form-label">Pixel (conversões)</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <VitraSelect value={convPixelId} onChange={setConvPixelId} ariaLabel="Pixel de conversão"
                  placeholder={pixels.length ? 'Selecione o pixel' : 'Liste os pixels →'}
                  options={pixels.map(p => ({ value: p.id, label: `${p.name}${p.is_active ? '' : ' (inativo)'}` }))} />
              </div>
              <button type="button" onClick={handleLoadPixels} className="btn-ghost flex-shrink-0 !px-3">Listar</button>
            </div>
          </label>
          <label className="block">
            <span className="form-label">Evento de conversão</span>
            <VitraSelect value={conversionEvent} onChange={setConversionEvent} ariaLabel="Evento de conversão"
              options={['LEAD', 'CONTACT', 'SCHEDULE', 'COMPLETE_REGISTRATION', 'VIEW_CONTENT', 'PURCHASE']} />
            <span className="mt-1 block text-[11px] text-white/40">O site precisa disparar esse evento no pixel para a otimização funcionar.</span>
          </label>
        </div>
      )}

      {/* Localização: regra fixa do gestor — toda campanha tem 2 conjuntos (Porto Alegre + Região do imóvel ≤2km). */}
      <div className="mt-4 rounded-xl border border-gold-500/25 bg-gold-500/[0.05] p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-200/80">Localização · 2 conjuntos de anúncios</p>
        <p className="mt-0.5 text-[11px] leading-4 text-white/45">Toda campanha sobe com <span className="text-white/70">Porto Alegre</span> (cidade inteira) + <span className="text-white/70">Região do imóvel</span> (raio ≤ {REGIONAL_RADIUS_MAX_KM} km do endereço).</p>
        <div className="mt-2.5 flex items-center gap-2">
          <input className="form-input !py-1.5 flex-1 text-xs" value={addr} onChange={e => setAddr(e.target.value)} placeholder="Endereço do imóvel (rua, número, bairro)" />
          <button type="button" onClick={handleGeocode} disabled={geoBusy} className="btn-ghost inline-flex shrink-0 items-center gap-1.5 !py-1.5 text-xs disabled:opacity-50">
            {geoBusy ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}Localizar
          </button>
        </div>
        {geoLabel && <p className="mt-1 truncate text-[10px] text-white/40" title={geoLabel}>📍 {geoLabel}</p>}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block"><span className="form-label !mb-1 !text-[10px]">Latitude</span>
            <input className="form-input !py-1.5 text-xs" value={geoLat} onChange={e => setGeoLat(e.target.value)} placeholder="-30.0608" inputMode="decimal" /></label>
          <label className="block"><span className="form-label !mb-1 !text-[10px]">Longitude</span>
            <input className="form-input !py-1.5 text-xs" value={geoLng} onChange={e => setGeoLng(e.target.value)} placeholder="-51.2115" inputMode="decimal" /></label>
          {geoHasPoint && <a href={`https://www.openstreetmap.org/?mlat=${Number(geoLat)}&mlon=${Number(geoLng)}#map=15/${Number(geoLat)}/${Number(geoLng)}`} target="_blank" rel="noreferrer" className="self-center text-[11px] text-gold-300 underline sm:self-end sm:pb-2">ver no mapa ↗</a>}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wide text-white/35">Raio</span>
          <input type="range" min="1" max={REGIONAL_RADIUS_MAX_KM} step="0.1" value={Math.min(REGIONAL_RADIUS_MAX_KM, Math.max(1, Number(radiusKm) || REGIONAL_RADIUS_MAX_KM))} onChange={e => setRadiusKm(Number(e.target.value))} className="flex-1 accent-gold-500" aria-label="Raio em km" />
          <span className="w-14 text-right text-xs text-white/70">{Math.min(REGIONAL_RADIUS_MAX_KM, Number(radiusKm) || REGIONAL_RADIUS_MAX_KM)} km</span>
        </div>
        <button type="button" onClick={applyGeoAdSets} className="btn-gold mt-2.5 inline-flex items-center gap-2 !py-1.5 text-xs"><CheckCircle2 size={14} />Definir os 2 conjuntos</button>
        {!geoHasPoint && <p className="mt-1.5 text-[11px] text-amber-300">⚠ Sem coordenadas válidas, só o conjunto de Porto Alegre é criado. Localize o endereço ou informe lat/lng para o raio do imóvel.</p>}
        {geoMsg && <p className={`mt-1.5 text-[11px] ${geoMsg.kind === 'ok' ? 'text-emerald-300' : geoMsg.kind === 'warn' ? 'text-amber-300' : 'text-red-300'}`}>{geoMsg.text}</p>}
      </div>

      {/* Opcoes avancadas (P1 UX): direcionamento, plataformas e publicos num <details> colapsado por
          padrao — 80% dos casos so precisa de conta/pagina/orcamento/destino. O estado persiste mesmo
          colapsado, entao o build usa os presets das campanhas de referencia normalmente. */}
      <details className="group mt-2">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-t border-white/10 pt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-300 [&::-webkit-details-marker]:hidden">
          <span>Opções avançadas · direcionamento, plataformas e públicos</span>
          <span className="text-white/40 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>

      {/* Direcionamento detalhado (interesses) — preset das campanhas de referência, editável. Aplicado aos conjuntos por geografia no build. */}
      {(() => { const est = audienceEstimate(); return (
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-200/80">Direcionamento detalhado</p>
          <span className={`text-[10px] ${est.cls}`} title={est.hint}>Alcance estimado: {est.label}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-4 text-white/45">Interesses destilados das campanhas vencedoras. Aplicado aos conjuntos por geografia.</p>
        <label className="mt-2 block">
          <span className="form-label !mb-1 !text-[10px]">Preset (origem)</span>
          <VitraSelect value={dtPresetKey} onChange={applyDetailedPreset} ariaLabel="Preset de direcionamento detalhado"
            options={DETAILED_TARGETING_PRESETS.map(p => ({ value: p.key, label: `${p.label} — ${p.origin}` }))} />
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {dtInterests.map(i => (
            <span key={i.id} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${i.tier === 'core' ? 'border-gold-500/40 text-gold-200' : i.tier === 'recommended' ? 'border-white/20 text-white/70' : 'border-white/10 text-white/45'}`} title={i.tier === 'core' ? 'Núcleo (obrigatório)' : i.tier === 'recommended' ? 'Recomendado' : 'Opcional'}>
              {i.name}
              {i.tier !== 'core' && <button type="button" onClick={() => removeDtInterest(i.id)} className="ml-0.5 text-white/40 hover:text-white" title="Remover">×</button>}
            </span>
          ))}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block"><span className="form-label !mb-1 !text-[10px]">Interesses extras (por nome, separados por vírgula)</span>
            <input className="form-input !py-1.5 text-xs" value={dtExtra} onChange={e => setDtExtra(e.target.value)} placeholder="ex.: financiamento imobiliário, mudança" /></label>
          <button type="button" onClick={() => setDtAdvantage(v => (v === 1 ? 0 : 1))} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left transition hover:border-white/20">
            <span className="text-[11px] text-white/70">Advantage (expansão)</span>
            <span className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${dtAdvantage === 1 ? 'bg-gold-500/70' : 'bg-white/15'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${dtAdvantage === 1 ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </span>
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-white/35">Núcleo (dourado) é obrigatório; recomendados/opcionais podem ser removidos. Advantage ligado = expansão (como a vencedora). Itens depreciados pela Meta são removidos automaticamente no envio.</p>
        <div className="mt-2.5 border-t border-white/10 pt-2.5">
          <button type="button" onClick={handleEstimate} disabled={estimate.loading || !adAccountId} className="btn-ghost inline-flex items-center gap-1.5 !py-1.5 text-xs disabled:opacity-50" title={!adAccountId ? 'Selecione a conta de anúncio' : 'Estimativa real da Meta por conjunto'}>
            {estimate.loading ? <Loader2 size={13} className="animate-spin" /> : <Users size={13} />}Estimar alcance (Meta)
          </button>
          {estimate.error && <p className="mt-1.5 text-[11px] text-red-300">{estimate.error}</p>}
          {Array.isArray(estimate.rows) && (
            <div className="mt-2 space-y-1">
              {estimate.rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-white/60">{r.label}</span>
                  <span className={r.ok ? 'text-white/85' : 'text-amber-300'}>{r.ok ? `~ ${fmtReach(r.lower)} – ${fmtReach(r.upper)} pessoas` : 'indisponível'}</span>
                </div>
              ))}
              <p className="text-[10px] text-white/30">Tamanho estimado do público (mensal) por conjunto — números da Meta, aproximados.</p>
            </div>
          )}
        </div>
      </div>
      ) })()}

      {/* Plataformas e posicionamentos (manuais) — preset das referências, editável. Aplicado aos conjuntos por geografia no build. */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-200/80">Plataformas e posicionamentos</p>
          <span className={`text-[10px] ${plAdvantagePlus ? 'text-emerald-300' : 'text-white/55'}`}>{plAdvantagePlus ? 'Advantage+ (automático)' : 'Posicionamentos manuais'}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-4 text-white/45">Onde os anúncios aparecem. O recomendado espelha as campanhas vencedoras (FB + IG, sem Messenger/Audience Network).</p>
        <label className="mt-2 block">
          <span className="form-label !mb-1 !text-[10px]">Preset (origem)</span>
          <VitraSelect value={plPresetKey} onChange={applyPlacementPreset} ariaLabel="Preset de posicionamentos"
            options={PLACEMENT_PRESETS.map(p => ({ value: p.key, label: `${p.label} — ${p.origin}` }))} />
        </label>
        {!plAdvantagePlus && (
          <div className="mt-2.5 space-y-2">
            {PLATFORM_META.map(pf => {
              const on = plPlatforms.has(pf.key)
              return (
                <div key={pf.key} className={`rounded-lg border p-2 ${on ? 'border-white/15 bg-white/[0.03]' : 'border-white/10'}`}>
                  <button type="button" onClick={() => togglePlatform(pf.key)} className="flex w-full items-center justify-between gap-2 text-left">
                    <span className={`text-xs font-medium ${on ? 'text-white/85' : 'text-white/40'}`}>{pf.label}</span>
                    <span className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${on ? 'bg-gold-500/70' : 'bg-white/15'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </span>
                  </button>
                  {on && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {pf.positions.map(pos => {
                        const sel = (plPositions[pf.key] || []).includes(pos.id)
                        return (
                          <button key={pos.id} type="button" onClick={() => togglePosition(pf.key, pos.id)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition ${sel ? (pos.incompat ? 'border-amber-400/50 text-amber-200' : 'border-gold-500/40 text-gold-200') : 'border-white/10 text-white/40 hover:border-white/25'}`}
                            title={pos.incompat ? 'Exige outro formato de arte (não cobre 4:5/9:16)' : ''}>
                            {sel ? '✓ ' : ''}{pos.label}{pos.incompat ? ' ⚠' : ''}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {placementWarnings().map((w, i) => (
          <p key={i} className={`mt-1.5 text-[11px] ${w.kind === 'warn' ? 'text-amber-300' : 'text-white/40'}`}>{w.kind === 'warn' ? '⚠ ' : 'ℹ '}{w.text}</p>
        ))}
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-2.5 py-1.5">
          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-300/80" />
          <span className="text-[11px] leading-4 text-white/70">Anúncios com vários anunciantes: <span className="font-medium text-emerald-300">Desativado</span> <span className="text-white/35">— enviado à Meta em todo anúncio novo (não altera anúncios existentes).</span></span>
        </div>
        <button type="button" onClick={() => applyPlacementPreset('fb_ig_recomendado')} className="btn-ghost mt-2.5 inline-flex items-center gap-1.5 !py-1.5 text-xs"><RotateCcw size={13} />Restaurar recomendado</button>
      </div>

      <div className="mt-4">
        <button type="button" onClick={handleSuggest} disabled={suggesting} className="btn-ghost inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {suggesting ? 'Sugerindo…' : (proposal.length ? 'Re-sugerir públicos (IA)' : 'Sugerir públicos por IA (opcional)')}
        </button>
        {proposal.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-white/45">{proposal.length} conjunto(s) propostos pela IA — cada um vira um ad set pausado:</p>
            {proposal.map((s, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-white">{s.label || s.group_key}</p>
                  <span className="flex-shrink-0 text-[10px] text-white/45">{s.age_min}–{s.age_max} anos{s.retargeting ? ' · retarget' : ''}</span>
                </div>
                {s.geo && (
                  <p className="mt-1 text-[10px] text-gold-200/70">
                    {s.geo === 'radius' ? `Geo: raio ${s.radius_km || 2}km${(s.lat != null && s.lng != null) ? ` (${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)})` : ''}` : s.geo === 'city' ? 'Geo: cidade inteira' : ''}
                  </p>
                )}
                {Array.isArray(s.interest_keywords) && s.interest_keywords.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {s.interest_keywords.map((k, j) => <span key={j} className="rounded bg-gold-500/10 px-1.5 py-0.5 text-[10px] text-gold-200">{k}</span>)}
                  </div>
                )}
                {s.rationale && <p className="mt-1.5 text-[11px] leading-4 text-white/40">{s.rationale}</p>}
                {s.retargeting && (
                  <div className="mt-2">
                    <VitraSelect
                      className="!py-1.5 text-xs"
                      ariaLabel="Público de retargeting"
                      value={s.custom_audience_id || ''}
                      onChange={v => assignAudience(i, v)}
                      options={[
                        { value: '', label: 'Retarget: público amplo (ou escolha um custom)' },
                        ...audiences.map(a => ({ value: a.id, label: `${a.name} · ${a.subtype}${a.size != null ? ` · ${a.size}` : ''}` })),
                      ]}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.015] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Públicos da Meta</span>
          <button type="button" onClick={handleListAudiences} disabled={audBusy} className="btn-ghost inline-flex items-center gap-1.5 !px-2.5 !py-1 text-xs disabled:opacity-50">
            {audBusy ? <Loader2 size={12} className="animate-spin" /> : null} Listar
          </button>
          {audMsg && <span className="text-[11px] text-white/50">{audMsg}</span>}
        </div>
        {audiences.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {audiences.map(a => <span key={a.id} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/55">{a.name} · {a.subtype}</span>)}
          </div>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex items-end gap-2">
            <label className="flex-1 block"><span className="form-label">Pixel (público de site)</span><input className="form-input !py-1.5 text-xs" value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="ID do pixel" /></label>
            <button type="button" onClick={handleCreateWebsite} disabled={audBusy || !pixelId} className="btn-ghost !px-2.5 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50">Criar site</button>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex-1 block"><span className="form-label">Lookalike (fonte)</span>
              <VitraSelect value={lkOrigin} onChange={setLkOrigin} placeholder="Selecione a fonte" ariaLabel="Fonte do lookalike" className="!py-1.5 text-xs"
                options={audiences.filter(a => a.subtype !== 'LOOKALIKE').map(a => ({ value: a.id, label: a.name }))} />
            </label>
            <button type="button" onClick={handleCreateLookalike} disabled={audBusy || !lkOrigin} className="btn-ghost !px-2.5 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50">Criar LAL</button>
          </div>
        </div>
      </div>
      </details>

      {error && (
        <div className="mt-4 rounded-lg border border-red-400/25 bg-red-950/25 px-4 py-3 text-xs text-red-100/85">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-300" />
            <div>
              <p>{error.message}</p>
              {error.issues?.length ? <ul className="mt-1 list-disc pl-4 text-red-200/70">{error.issues.map((i, k) => <li key={k}>{i}</li>)}</ul> : null}
            </div>
          </div>
        </div>
      )}

      {!loading && missingToBuild.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-3 text-[11px] leading-4 text-amber-200">
          <p className="font-semibold">Para liberar “Criar rascunho na Meta”, falta:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {missingToBuild.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={handleBuild} disabled={!canBuild} title={canBuild ? '' : `Falta: ${missingToBuild.join('; ')}`} className="btn-gold inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
          {loading ? 'Criando rascunho…' : 'Criar rascunho na Meta (pausado)'}
        </button>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-2xs leading-4 text-white/45">
            Validando criativos → criando campanha, conjuntos e anúncios na Meta — tudo <span className="text-white/70">pausado</span>. Pode levar alguns segundos.
          </span>
        )}
        {result?.meta_campaign_id && (
          <>
            <a href={result.ads_manager_url} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center justify-center gap-2">Abrir no Ads Manager</a>
            <button type="button" onClick={handleActivate} disabled={activating || result.activated} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50">
              {activating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {result.activated ? 'Ativada ✓' : 'Publicar (ativar)'}
            </button>
          </>
        )}
      </div>

      {result?.meta_campaign_id && !result.activated && (
        <p className="mt-3 text-[11px] leading-4 text-white/45">Rascunho criado <span className="text-white/65">PAUSADO</span> (campanha {result.meta_campaign_id}). Revise no Ads Manager; “Publicar (ativar)” inicia o gasto e pede confirmação.</p>
      )}

      {Array.isArray(result?.skipped_creatives) && result.skipped_creatives.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-4 text-amber-200">
          <p className="font-semibold">{result.skipped_creatives.length} criativo(s) não publicado(s) — copy reprovada na validação de marca:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {result.skipped_creatives.map((s, i) => (
              <li key={i}><span className="text-amber-100">{s.headline || s.asset_id}</span>: {Array.isArray(s.issues) ? s.issues.join('; ') : String(s.issues)}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(result?.targeting_adjustments) && result.targeting_adjustments.length > 0 && (
        <div className="mt-3 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-[11px] leading-4 text-sky-200">
          <p className="font-semibold">Direcionamento ajustado em {result.targeting_adjustments.length} conjunto(s) — a Meta recusou interesses depreciados; mantida a segmentação por geografia:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {result.targeting_adjustments.map((t, i) => (
              <li key={i}><span className="text-sky-100">{t.label || t.group_key || `Conjunto ${i + 1}`}</span>: {t.note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
