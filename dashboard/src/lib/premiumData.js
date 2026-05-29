import { supabase } from './supabase.js'

export const PREMIUM_TABLES = [
  {
    name: 'premium_campaigns',
    label: 'Campanhas',
    purpose: 'Brief, objetivo, produto, periodo, status e plano de conteudo.',
  },
  {
    name: 'premium_campaign_assets',
    label: 'Assets',
    purpose: 'Pecas planejadas e renderizadas: Meta Ads, carrosseis, WhatsApp, e-mail e landing.',
  },
  {
    name: 'premium_content_posts',
    label: 'Conteudos',
    purpose: 'Posts editoriais derivados dos assets, com legenda, hashtags, CTA e agenda.',
  },
  {
    name: 'premium_publications',
    label: 'Publicacoes',
    purpose: 'Vinculo entre conteudo planejado e post real publicado ou importado da plataforma.',
  },
  {
    name: 'premium_metrics',
    label: 'Metricas',
    purpose: 'Historico por publicacao, separando coleta organica, paga, manual e importada.',
  },
  {
    name: 'premium_generation_jobs',
    label: 'Jobs',
    purpose: 'Fila de geracao, renderizacao, upload, importacao e sincronizacao de metricas.',
  },
  {
    name: 'social_accounts',
    label: 'Contas sociais',
    purpose: 'Mapeamento das contas Vitra Premium sem armazenar tokens no browser.',
  },
  {
    name: 'social_metric_snapshots',
    label: 'Snapshots sociais',
    purpose: 'Foto historica de seguidores, alcance e impressoes por conta.',
  },
]

const ASSET_BLUEPRINTS = [
  ['meta-awareness-feed', 'meta_ad', 'meta_ads', 'feed', 'Meta Ads - Awareness Feed', '1:1', 'premium-editorial-feed'],
  ['meta-awareness-story', 'meta_ad', 'meta_ads', 'story', 'Meta Ads - Awareness Story', '9:16', 'premium-editorial-story'],
  ['meta-leads-feed', 'meta_ad', 'meta_ads', 'feed', 'Meta Ads - Leads Feed', '1:1', 'premium-lead-feed'],
  ['meta-leads-story', 'meta_ad', 'meta_ads', 'story', 'Meta Ads - Leads Story', '9:16', 'premium-lead-story'],
  ['meta-retarget-feed', 'meta_ad', 'meta_ads', 'feed', 'Meta Ads - Retarget Feed', '1:1', 'premium-retarget-feed'],
  ['meta-retarget-story', 'meta_ad', 'meta_ads', 'story', 'Meta Ads - Retarget Story', '9:16', 'premium-retarget-story'],
  ['reels-hook', 'short_video', 'instagram', 'reels', 'Reels - Hook de Campanha', '9:16', 'premium-reels-hook'],
  ['reels-proof', 'short_video', 'instagram', 'reels', 'Reels - Prova de Valor', '9:16', 'premium-reels-proof'],
  ['carousel-cover', 'carousel', 'instagram', 'carousel_cover', 'Carrossel - Capa Editorial', '4:5', 'premium-carousel-cover'],
  ['carousel-market', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - Mercado e Valorizacao', '4:5', 'premium-carousel-market'],
  ['carousel-lifestyle', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - Lifestyle', '4:5', 'premium-carousel-lifestyle'],
  ['carousel-investment', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - Investimento', '4:5', 'premium-carousel-investment'],
  ['carousel-authority', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - Autoridade', '4:5', 'premium-carousel-authority'],
  ['carousel-cta', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - CTA Final', '4:5', 'premium-carousel-cta'],
  ['whatsapp-opener', 'whatsapp', 'whatsapp', 'message', 'WhatsApp - Abertura Consultiva', null, 'premium-whatsapp-opener'],
  ['whatsapp-followup', 'whatsapp', 'whatsapp', 'message', 'WhatsApp - Follow-up 24h', null, 'premium-whatsapp-followup'],
  ['whatsapp-visit', 'whatsapp', 'whatsapp', 'message', 'WhatsApp - Convite Visita', null, 'premium-whatsapp-visit'],
  ['email-invite', 'email', 'email', 'html_email', 'E-mail - Convite Curadoria', null, 'premium-email-invite'],
  ['email-proof', 'email', 'email', 'html_email', 'E-mail - Prova e Escassez', null, 'premium-email-proof'],
  ['landing-hero', 'landing_page', 'site', 'landing_section', 'Landing - Hero Premium', 'desktop', 'premium-landing-hero'],
  ['landing-gallery', 'landing_page', 'site', 'landing_section', 'Landing - Galeria e Diferenciais', 'desktop', 'premium-landing-gallery'],
  ['thumbnail-youtube', 'thumbnail', 'youtube', 'thumbnail', 'YouTube - Thumbnail', '16:9', 'premium-youtube-thumb'],
  ['stories-sequence-1', 'story', 'instagram', 'story', 'Stories - Sequencia 1', '9:16', 'premium-stories-1'],
  ['stories-sequence-2', 'story', 'instagram', 'story', 'Stories - Sequencia 2', '9:16', 'premium-stories-2'],
]

const POST_BLUEPRINTS = [
  {
    assetKey: 'reels-hook',
    platform: 'instagram',
    format: 'reels',
    editorial_pillar: 'Lifestyle & Alto Padrao',
    title: 'Abertura da campanha',
    hook: 'Um endereco raro pede uma apresentacao a altura.',
  },
  {
    assetKey: 'carousel-market',
    platform: 'instagram',
    format: 'carousel',
    editorial_pillar: 'Mercado & Valorizacao',
    title: 'Por que este ativo merece atencao',
    hook: 'O alto padrao tambem e uma decisao patrimonial.',
  },
  {
    assetKey: 'carousel-investment',
    platform: 'instagram',
    format: 'carousel',
    editorial_pillar: 'Investimento & Patrimonio',
    title: 'Tese de investimento',
    hook: 'Localizacao, liquidez e escassez mudam a conversa.',
  },
  {
    assetKey: 'carousel-lifestyle',
    platform: 'instagram',
    format: 'carousel',
    editorial_pillar: 'Lifestyle & Alto Padrao',
    title: 'Experiencia de morar',
    hook: 'A planta certa organiza a vida antes mesmo da mudanca.',
  },
  {
    assetKey: 'meta-leads-feed',
    platform: 'facebook',
    format: 'feed',
    editorial_pillar: 'Imoveis & Produtos',
    title: 'Anuncio de captacao',
    hook: 'Receba uma curadoria reservada da Vitra Premium.',
  },
  {
    assetKey: 'stories-sequence-1',
    platform: 'instagram',
    format: 'stories',
    editorial_pillar: 'Autoridade & Posicionamento',
    title: 'Stories de autoridade',
    hook: 'Nao e volume de oferta. E precisao de curadoria.',
  },
]

export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

export async function loadPremiumWorkspace() {
  const requests = [
    supabase.from('premium_campaigns').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('premium_campaign_assets').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('premium_content_posts').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('premium_publications').select('*').order('published_at', { ascending: false, nullsFirst: false }).limit(300),
    supabase.from('premium_metrics').select('*').order('collected_at', { ascending: false }).limit(500),
    supabase.from('premium_generation_jobs').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('social_accounts').select('*').eq('brand_scope', 'vitra_premium').order('created_at', { ascending: false }).limit(50),
    supabase.from('social_metric_snapshots').select('*').order('snapshot_at', { ascending: false }).limit(200),
  ]

  const [
    campaigns,
    assets,
    posts,
    publications,
    metrics,
    jobs,
    accounts,
    snapshots,
  ] = await withTimeout(Promise.all(requests), 8000, 'Tempo esgotado ao consultar o Supabase Premium.')

  const responses = [campaigns, assets, posts, publications, metrics, jobs, accounts, snapshots]
  const failed = responses.find(response => response.error)
  if (failed) {
    const error = new Error(failed.error.message)
    error.supabase = failed.error
    throw error
  }

  return {
    campaigns: campaigns.data || [],
    assets: assets.data || [],
    posts: posts.data || [],
    publications: publications.data || [],
    metrics: metrics.data || [],
    jobs: jobs.data || [],
    accounts: accounts.data || [],
    snapshots: snapshots.data || [],
  }
}

function withTimeout(promise, ms, message) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export async function createPremiumCampaign(form) {
  const product = form.product_name?.trim() || form.name.trim()
  const name = form.name.trim() || `Campanha ${product}`
  const slug = `${slugify(name)}-${Date.now().toString(36)}`
  const now = new Date().toISOString()

  const campaignPayload = {
    name,
    slug,
    product_name: product,
    property_type: form.property_type || null,
    neighborhood: form.neighborhood || null,
    city: form.city || 'Porto Alegre',
    target_audience: form.target_audience || null,
    campaign_objective: form.campaign_objective || 'lead_generation',
    offer: form.offer || null,
    tone: 'luxury_editorial',
    status: 'planning',
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    budget_type: form.budget_type || 'organic_and_paid',
    source: 'dashboard_react',
    brief: {
      audience: form.target_audience,
      promise: form.offer,
      visual_direction: 'Vitra Premium editorial, black and gold, high-end real estate',
      created_from: 'premium_dashboard_phase_1',
    },
    content_plan: {
      blueprint_version: 'premium_phase_1_react',
      asset_count: ASSET_BLUEPRINTS.length,
      post_count: POST_BLUEPRINTS.length,
    },
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('premium_campaigns')
    .insert(campaignPayload)
    .select('*')
    .single()

  if (campaignError) throw campaignError

  const assetPayload = buildAssetPayloads(campaign, form)
  const { data: insertedAssets, error: assetsError } = await supabase
    .from('premium_campaign_assets')
    .insert(assetPayload)
    .select('*')

  if (assetsError) throw assetsError

  const postPayload = buildPostPayloads(campaign, insertedAssets || [], form)
  const { data: insertedPosts, error: postsError } = await supabase
    .from('premium_content_posts')
    .insert(postPayload)
    .select('*')

  if (postsError) throw postsError

  const jobPayload = [
    {
      campaign_id: campaign.id,
      job_type: 'campaign_generation',
      provider: 'dashboard_react',
      status: 'done',
      progress: 100,
      started_at: now,
      finished_at: now,
      input_payload: { form },
      output_payload: {
        campaign_id: campaign.id,
        assets: insertedAssets?.length || 0,
        posts: insertedPosts?.length || 0,
      },
    },
    {
      campaign_id: campaign.id,
      job_type: 'asset_render',
      provider: 'card-builder',
      status: 'queued',
      progress: 0,
      input_payload: {
        renderer: 'src/integrations/card-builder.js',
        storage_bucket: 'cards',
        asset_ids: (insertedAssets || []).map(asset => asset.id),
      },
    },
    {
      campaign_id: campaign.id,
      job_type: 'metrics_sync',
      provider: 'meta-api',
      status: 'queued',
      progress: 0,
      input_payload: {
        requires_mapping: true,
        sources: ['instagram_insights', 'facebook_insights', 'ads_insights'],
      },
    },
  ]

  const { error: jobsError } = await supabase
    .from('premium_generation_jobs')
    .insert(jobPayload)

  if (jobsError) throw jobsError

  return campaign
}

function buildAssetPayloads(campaign, form) {
  const product = campaign.product_name || campaign.name
  const place = [campaign.neighborhood, campaign.city].filter(Boolean).join(', ')
  const offer = campaign.offer || form.offer || 'Curadoria reservada Vitra Premium'
  const cta = form.cta || 'Solicitar curadoria'

  return ASSET_BLUEPRINTS.map(([blueprintKey, assetType, channel, format, title, aspectRatio, templateKey], index) => ({
    campaign_id: campaign.id,
    asset_type: assetType,
    channel,
    format,
    title,
    headline: buildHeadline(product, place, index),
    copy: buildAssetCopy(product, offer, channel),
    cta,
    status: channel === 'whatsapp' || channel === 'email' ? 'planned' : 'queued',
    aspect_ratio: aspectRatio,
    template_key: templateKey,
    storage_bucket: channel === 'whatsapp' || channel === 'email' ? null : 'cards',
    metadata: {
      blueprint_key: blueprintKey,
      phase: 'phase_1_react_migration',
      brand_scope: 'vitra_premium',
      visual_rules: ['black_gold', 'editorial', 'luxury_refined'],
    },
  }))
}

function buildPostPayloads(campaign, assets, form) {
  const cta = form.cta || 'Solicitar curadoria'
  const hashtagCity = campaign.city ? `#${campaign.city.replace(/\s+/g, '')}` : '#PortoAlegre'

  return POST_BLUEPRINTS.map(post => {
    const asset = assets.find(item => item.metadata?.blueprint_key === post.assetKey)
    return {
      campaign_id: campaign.id,
      asset_id: asset?.id || null,
      platform: post.platform,
      format: post.format,
      editorial_pillar: post.editorial_pillar,
      title: `${post.title}: ${campaign.product_name || campaign.name}`,
      hook: post.hook,
      caption: [
        post.hook,
        campaign.offer || 'Uma curadoria premium para quem decide com criterio.',
        cta,
      ].filter(Boolean).join('\n\n'),
      hashtags: ['#VitraPremium', '#ImoveisDeLuxo', hashtagCity, '#AltoPadrao'],
      cta,
      status: 'planned',
      notes: 'Conteudo criado na migracao React. Renderizacao final entra na Fase 2.',
      metadata: {
        blueprint_asset_key: post.assetKey,
        phase: 'phase_1_react_migration',
      },
    }
  })
}

function buildHeadline(product, place, index) {
  const variants = [
    `${product}: uma categoria acima`,
    `Curadoria premium em ${place || 'Porto Alegre'}`,
    'Arquitetura, liquidez e presenca',
    'Para comprar com criterio',
  ]
  return variants[index % variants.length]
}

function buildAssetCopy(product, offer, channel) {
  if (channel === 'whatsapp') {
    return `Ola. Separei uma curadoria Vitra Premium sobre ${product}. ${offer}`
  }

  if (channel === 'email') {
    return `Uma leitura consultiva sobre ${product}, com foco em localizacao, escassez e potencial patrimonial.`
  }

  return `${offer}. Uma campanha Vitra Premium com linguagem editorial, foco em alto padrao e vinculo direto com performance.`
}
