export const BRAND_SCOPES = {
  premium: 'vitra_premium',
  imobiliaria: 'vitra_imobiliaria',
}

export const BRAND_PROFILES = {
  [BRAND_SCOPES.premium]: {
    scope: BRAND_SCOPES.premium,
    shortName: 'Premium',
    name: 'Vitra Premium',
    descriptor: 'Alto padrao',
    productContext: 'Curadoria premium',
    defaultProductType: 'Apartamento alto padrão',
    defaultAudience: 'Compradores e investidores de alto padrão em Porto Alegre',
    defaultOffer: 'Curadoria reservada Vitra Premium',
    defaultCta: 'Conheça o projeto',
    tone: 'luxury_editorial',
    visualDirection: 'Vitra Premium editorial, black and gold, high-end real estate',
    visualRules: ['black_gold', 'editorial', 'luxury_refined'],
    qaBrandLabel: 'Regra Premium preto + dourado',
    supportAssetPurpose: 'Asset operacional de apoio da campanha Premium.',
    supportAssetPattern: 'Segue a identidade editorial Premium do renderizador.',
    hashtagSet: ['#VitraPremium', '#ImoveisDeLuxo', '#AltoPadrao'],
    shellKicker: 'Central de curadoria',
    areaKicker: 'Operacao de alto padrao',
    trafficKicker: 'Centro operacional de midia paga',
    dashboardTitle: 'Central de curadoria e campanhas',
    trafficTitle: 'Tráfego Pago Premium',
    dashboardSubtitle: 'Campanhas, assets, publicacoes e metricas reais conectados ao Supabase da Vitra Premium.',
    trafficSubtitle: 'Fila dedicada para gerar, revisar, aprovar e exportar criativos Meta Ads com a identidade Vitra Premium.',
    emptyCampaignTitle: 'Nenhuma campanha Premium cadastrada',
    emptyCampaignNote: 'A primeira campanha cria o registro principal, a matriz inicial de assets e os conteudos planejados.',
    emptyTrafficTitle: 'Nenhuma campanha pronta para tráfego pago',
    emptyTrafficNote: 'Crie a primeira campanha Premium para abrir a esteira de geração, QA e exportação dos criativos Meta Ads.',
    campaignFallback: 'Campanha Premium',
    metaPackageType: 'vitra_premium_meta_ads_package',
    assetBasePath: '/brand/vitra-premium',
    assetManifestPath: '/brand/vitra-premium/manifest.json',
    approvedAssets: {
      horizontalLogo: '/brand/vitra-premium/logos/horizontal/approved/vitra-premium-horizontal-aprovada.svg',
      horizontalLogoPng8k: '/brand/vitra-premium/logos/horizontal/approved/vitra-premium-horizontal-aprovada-8k.png',
      horizontalInvertidaOffWhite: '/brand/vitra-premium/logos/horizontal/invertida-off-white/vitra-premium-horizontal-aprovada-invertida-off-white.svg',
      verticalLogo: '/brand/vitra-premium/logos/vertical/approved/vitra-premium-vertical-aprovada.svg',
      verticalLogoPng8k: '/brand/vitra-premium/logos/vertical/approved/vitra-premium-vertical-aprovada-8k.png',
    },
  },
  [BRAND_SCOPES.imobiliaria]: {
    scope: BRAND_SCOPES.imobiliaria,
    shortName: 'Imobiliária',
    name: 'Vitra Imobiliária',
    descriptor: 'Marca-mae',
    productContext: 'Portfólio Vitra',
    defaultProductType: 'Apartamento',
    defaultAudience: 'Compradores, investidores e famílias buscando imóveis em Porto Alegre',
    defaultOffer: 'Assessoria patrimonial Vitra Imobiliária',
    defaultCta: 'Fale com a Vitra',
    tone: 'institutional_commercial',
    visualDirection: 'Vitra Imobiliaria, navy and gold, trustworthy Porto Alegre real estate',
    visualRules: ['navy_gold', 'institutional', 'real_estate_advisory'],
    qaBrandLabel: 'Regra Vitra Imobiliária navy + dourado',
    supportAssetPurpose: 'Asset operacional de apoio da campanha da marca-mae.',
    supportAssetPattern: 'Segue a identidade Vitra Imobiliária com navy, dourado e linguagem consultiva.',
    hashtagSet: ['#VitraImobiliaria', '#PortoAlegre', '#Imoveis'],
    shellKicker: 'Operação imobiliária',
    areaKicker: 'Marca-mae Vitra',
    trafficKicker: 'Centro operacional de midia paga',
    dashboardTitle: 'Central Vitra Imobiliária',
    trafficTitle: 'Tráfego Pago Vitra Imobiliária',
    dashboardSubtitle: 'Campanhas, assets, publicacoes e metricas para o portfólio geral, imóveis de médio e baixo padrão e posicionamento da marca-mãe.',
    trafficSubtitle: 'Fila dedicada para gerar, revisar, aprovar e exportar criativos Meta Ads com a identidade da Vitra Imobiliária.',
    emptyCampaignTitle: 'Nenhuma campanha da Vitra Imobiliária cadastrada',
    emptyCampaignNote: 'A primeira campanha cria o brief, a matriz de criativos e a esteira de tráfego pago da marca-mãe.',
    emptyTrafficTitle: 'Nenhuma campanha de tráfego da Vitra Imobiliária',
    emptyTrafficNote: 'Crie a primeira campanha da marca-mãe para gerar variações de criativos Meta Ads sem misturar com Premium.',
    campaignFallback: 'Campanha Vitra Imobiliária',
    metaPackageType: 'vitra_imobiliaria_meta_ads_package',
    assetBasePath: '/brand/vitra-imobiliaria',
    assetManifestPath: '/brand/vitra-imobiliaria/manifest.json',
    approvedAssets: {
      horizontalLogo: '/brand/vitra-imobiliaria/svg/logo-horizontal-escuro.svg',
      horizontalLogoPng8k: '/brand/vitra-imobiliaria/logos/horizontal/approved/vitra-mae-horizontal-aprovada-8k.png',
      verticalLogo: '/brand/vitra-imobiliaria/svg/logo-vertical-escuro.svg',
      verticalLogoPng8k: '/brand/vitra-imobiliaria/logos/vertical/approved/vitra-mae-vertical-aprovada-8k.png',
      isolatedV: '/brand/vitra-imobiliaria/svg/v-isolado-colorido.svg',
      avatarPng: '/brand/vitra-imobiliaria/png-6x/v-isolado-colorido.png',
    },
  },
}

export function getBrandProfile(scope = BRAND_SCOPES.premium) {
  return BRAND_PROFILES[scope] || BRAND_PROFILES[BRAND_SCOPES.premium]
}

export function inferCampaignBrandScope(campaign) {
  return (
    campaign?.brand_scope ||
    campaign?.brief?.brand_scope ||
    campaign?.brief?.qa_policy?.brand_scope ||
    campaign?.content_plan?.brand_scope ||
    BRAND_SCOPES.premium
  )
}

export function inferAssetBrandScope(asset, campaignById = new Map()) {
  return (
    asset?.metadata?.brand_scope ||
    inferCampaignBrandScope(campaignById.get(asset?.campaign_id)) ||
    BRAND_SCOPES.premium
  )
}
