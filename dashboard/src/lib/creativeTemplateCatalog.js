import { BRAND_SCOPES } from './brandProfiles.js'

export const TEMPLATE_FRAME_VARIANTS = {
  noFrame: 'sem-moldura',
  goldFrame: 'com-moldura',
}

const FORMAT_SUFFIXES = ['feed', 'story', 'wide']

const variantOptions = [
  { id: TEMPLATE_FRAME_VARIANTS.noFrame, label: 'Sem moldura', frame: 'none' },
  { id: TEMPLATE_FRAME_VARIANTS.goldFrame, label: 'Com moldura', frame: 'gold' },
]

export const DEFAULT_TEMPLATE_IMAGE_SLOTS = [
  { id: 'fachada', label: 'Fachada / principal', multiple: false, required: true },
  { id: 'living', label: 'Interior / living', multiple: false },
  { id: 'varanda', label: 'Varanda / vista', multiple: false },
  { id: 'infraestrutura', label: 'Infraestrutura / lazer', multiple: false },
  { id: 'extras', label: 'Imagens extras', multiple: true },
]

const commonPremiumFieldGroups = [
  {
    id: 'product',
    title: 'Dados do Produto',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Lake Baikal' },
      { key: 'tagline', label: 'Tagline / Empreendimento', type: 'text', placeholder: 'Ex: GOLDEN LAKE - MULTIPLAN' },
      { key: 'location', label: 'Localizacao', type: 'text', placeholder: 'Ex: Orla do Guaiba, Porto Alegre' },
      { key: 'area', label: 'Metragem', type: 'text', placeholder: 'Ex: 195 a 250 m2' },
      { key: 'suites', label: 'Suites', type: 'text', placeholder: 'Ex: 4 suites' },
      { key: 'towers', label: 'Andares / Torres', type: 'text', placeholder: 'Ex: 2 torres de 30 pavimentos' },
      { key: 'differentials', label: 'Diferenciais', type: 'textarea', placeholder: 'Ex: Beach Club, lago cristalino, spa', colSpan: 'full' },
      { key: 'price', label: 'Preco', type: 'money', placeholder: 'Ex: Sob consulta' },
    ],
  },
  {
    id: 'copy',
    title: 'Textos Base',
    fields: [
      { key: 'suggested_headline', label: 'Headline sugerida', type: 'text', placeholder: 'Ex: O proximo capitulo de sofisticacao na Orla', colSpan: 'full' },
      { key: 'suggested_copy', label: 'Copy sugerida', type: 'textarea', placeholder: 'Ex: Residencias de 195 a 250 m2 com 4 suites.', colSpan: 'full' },
      { key: 'cta', label: 'CTA padrao', type: 'text', placeholder: 'Ex: Conheca o projeto', colSpan: 'full' },
    ],
  },
]

const dualPhotoOfferFieldGroups = [
  {
    id: 'offer',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Isla Zona Sul' },
      { key: 'suggested_headline', label: 'Headline', type: 'text', required: true, maxLength: 36, helper: 'Headline curta — ate 36 caracteres para caber na arte (2 linhas).', placeholder: 'Ex: More ou invista na Zona Norte', colSpan: 'full' },
      { key: 'area', label: 'Subtitulo / caracteristica', type: 'text', placeholder: 'Ex: 2 dormitorios com suite, churrasqueira e ate 2 vagas', colSpan: 'full' },
      { key: 'price_from', label: 'Valor de', type: 'money', placeholder: 'Ex: R$ 450 mil' },
      { key: 'price', label: 'Valor por', type: 'money', required: true, placeholder: 'Ex: R$ 399 mil' },
      { key: 'differentials', label: 'Diferenciais', type: 'list', required: true, placeholder: 'Um diferencial por linha', helper: 'Use 2 itens para este layout.', colSpan: 'full' },
      { key: 'cta', label: 'Texto do botao', type: 'text', placeholder: 'Ex: Clique para receber mais informacoes', colSpan: 'full' },
    ],
  },
]

const patiosGalleryFieldGroups = [
  {
    id: 'gallery',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Casa com patio' },
      { key: 'suggested_headline', label: 'Headline principal', type: 'text', required: true, maxLength: 30, helper: 'Headline bem curta — ate 30 caracteres para manter a fonte legivel ao lado das fotos.', placeholder: 'Ex: 2 dorm. c/ suite e 2 patios', colSpan: 'full' },
      { key: 'price', label: 'Valor de oportunidade', type: 'money', required: true, placeholder: 'Ex: R$ 419.000,00' },
      { key: 'differentials', label: 'Caracteristicas do imovel', type: 'list', required: true, placeholder: '106m2 privativos\nSuite e churrasqueira\nBaixo custo condominio\nVaga escritura coberta', colSpan: 'full' },
      { key: 'location', label: 'Texto de localizacao', type: 'text', placeholder: 'Ex: A 10 min. do Praia de Belas', colSpan: 'full' },
      { key: 'neighborhood', label: 'Bairro', type: 'text', placeholder: 'Ex: Medianeira' },
    ],
  },
]

const financiamentoOrlaFieldGroups = [
  {
    id: 'financing',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Nova Orla' },
      { key: 'suggested_headline', label: 'Headline', type: 'text', required: true, maxLength: 34, helper: 'Headline curta — ate 34 caracteres para caber na arte deste template.', placeholder: 'Ex: 1 dorm e 2 dorm junto a Nova Orla', colSpan: 'full' },
      { key: 'financing_claim', formKey: 'tagline', label: 'Chamada de financiamento', type: 'text', placeholder: 'Ex: Ate 100% financiado', colSpan: 'full' },
      { key: 'price', label: 'Valor a partir de', type: 'money', required: true, placeholder: 'Ex: R$ 242.050,00' },
      { key: 'neighborhood', label: 'Bairro / localizacao curta', type: 'text', placeholder: 'Ex: Bairro Cristal' },
    ],
  },
]

const meninoDeusFieldGroups = [
  {
    id: 'opportunity',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Oportunidade Menino Deus' },
      { key: 'neighborhood', label: 'Bairro em destaque', type: 'text', required: true, placeholder: 'Ex: Menino Deus' },
      { key: 'suites', label: 'Faixa principal', type: 'text', required: true, maxLength: 32, helper: 'Aparece na tarja navy — ate 32 caracteres para caber na arte.', placeholder: 'Ex: 2 dormitorios c/ suite', colSpan: 'full' },
      { key: 'price', label: 'Valor', type: 'money', required: true, placeholder: 'Ex: R$ 539 mil' },
      { key: 'condo_argument', formKey: 'offer', label: 'Argumento lateral', type: 'text', maxLength: 28, helper: 'Argumento curto — ate 28 caracteres para caber na arte.', placeholder: 'Ex: Menor valor do condominio' },
      { key: 'differentials', label: 'Diferenciais', type: 'list', placeholder: '61m2 - Churrasqueira e sacada\nInfraestrutura completa\nImovel nunca habitado\n10o andar com vista livre', colSpan: 'full' },
      { key: 'location', label: 'Endereco / localizacao', type: 'text', required: true, placeholder: 'Ex: Av. Jose de Alencar - Menino Deus', colSpan: 'full' },
    ],
  },
]

// Template 05 (New Life / Av. Ipiranga): foto unica de fundo + headline condensada,
// preco De/Por, checklist com selo dourado e CTA amarelo de alto contraste.
// Referencia aprovada: criativos-aprovados-vitra-imobiliaria/new life.jpeg
const heroChecklistFieldGroups = [
  {
    id: 'hero-offer',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: New Life' },
      { key: 'suggested_headline', label: 'Headline', type: 'text', required: true, maxLength: 40, helper: 'Headline curta — quebra em ate 3 linhas na arte (ate 40 caracteres).', placeholder: 'Ex: 3 dorms com suite junto a Av. Ipiranga', colSpan: 'full' },
      { key: 'price_from', label: 'Valor de (riscado)', type: 'money', placeholder: 'Ex: R$ 560.000,00' },
      { key: 'price', label: 'Valor por', type: 'money', required: true, placeholder: 'Ex: R$ 439.000,00' },
      { key: 'differentials', label: 'Atributos do checklist', type: 'list', required: true, placeholder: '75m2 privativos\nVaga de garagem coberta\nInfraestrutura completa\nPronto para morar\n2 minutos da PUCRS', helper: 'Um atributo por linha — ate 5 viram linhas com selo dourado.', colSpan: 'full' },
      { key: 'cta', label: 'Texto do botao', type: 'text', placeholder: 'Ex: Clique abaixo e receba mais informacoes', colSpan: 'full' },
    ],
  },
]

// Template 06 (Zona Norte / Isla): composicao centralizada fiel a peca aprovada original —
// wordmark VITRA, headline 2 linhas (2a dourada), subtitulo, pill branco De/Por, duas fotos
// grandes lado a lado sem moldura, dois selos badge-check e CTA pill dourado. Safe zone do Meta
// aplicada desde o nascimento (skill margem-seguranca-criativos).
// Referencia aprovada: criativos-aprovados-vitra-imobiliaria/2fe17ff8 (feed) e f38e4f2b (story).
const duoSelosFieldGroups = [
  {
    id: 'duo-offer',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Isla Zona Sul' },
      { key: 'suggested_headline', label: 'Headline', type: 'text', required: true, maxLength: 40, helper: 'Quebra em 2 linhas na arte — a segunda linha sai em dourado.', placeholder: 'Ex: More ou invista no coracao da Zona Norte', colSpan: 'full' },
      { key: 'area', label: 'Subtitulo / caracteristica', type: 'text', placeholder: 'Ex: 2 dormitorios com suite, churrasqueira e ate 2 vagas', colSpan: 'full' },
      { key: 'price_from', label: 'Valor de (riscado)', type: 'money', placeholder: 'Ex: R$ 450 mil' },
      { key: 'price', label: 'Valor por', type: 'money', required: true, placeholder: 'Ex: R$ 399 mil' },
      { key: 'differentials', label: 'Selos de beneficio', type: 'list', required: true, placeholder: 'Proximo ao Lindoia Tenis Clube\nInfraestrutura completa de lazer', helper: 'Ate 2 itens — viram selos dourados na arte.', colSpan: 'full' },
      { key: 'cta', label: 'Texto do botao', type: 'text', placeholder: 'Ex: Clique para receber mais informacoes', colSpan: 'full' },
    ],
  },
]

// Template 07 (San Clemente / Bairro Gloria): foto hero no topo + painel azul (familia azul do
// brandbook em degrade para navy) com headline 2 linhas brancas + destaque dourado, lista de setas
// e preco "Oportunidade por"; galeria lateral de 2 fotos sobrepondo hero e painel. Sem CTA (fiel a
// peca original). Safe zone do Meta aplicada desde o nascimento.
// Referencia aprovada: criativos-aprovados-vitra-imobiliaria/1040ccb5 (feed) e 83b3c406 (story).
const heroPanelFieldGroups = [
  {
    id: 'panel-offer',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: San Clemente' },
      { key: 'suggested_headline', label: 'Headline', type: 'text', required: true, maxLength: 40, helper: 'Quebra em ate 2 linhas brancas no painel.', placeholder: 'Ex: Linda casa em condominio 4 suites + 2 vagas', colSpan: 'full' },
      { key: 'location', label: 'Destaque dourado (3a linha)', type: 'text', required: true, maxLength: 28, helper: 'Linha de impacto em dourado — ate 28 caracteres.', placeholder: 'Ex: A 500m da 3a Perimetral', colSpan: 'full' },
      { key: 'differentials', label: 'Lista com setas', type: 'list', required: true, placeholder: '220m2 privativos\n4 suites sendo 1 terrea\nInfra completa de lazer\nSemi mobiliado\nBairro Gloria', helper: 'Ate 5 itens — cada um vira uma linha com seta dourada.', colSpan: 'full' },
      { key: 'price', label: 'Oportunidade por', type: 'money', required: true, placeholder: 'Ex: R$ 1.269.900,00' },
    ],
  },
]

// Template 08 (Lançamento / Em breve): foto hero full-bleed + selo/tag dourado no topo + headline
// grande + linha de localização + CTA pill. Peça de expectativa/topo de funil (sem De/Por nem checklist).
// Safe zone do Meta aplicada desde o nascimento (skill margem-seguranca-criativos).
const lancamentoFieldGroups = [
  {
    id: 'lancamento',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Residencial Aurora' },
      { key: 'tagline', label: 'Selo de lançamento', type: 'text', required: true, maxLength: 16, helper: 'Texto do selo dourado — curto (ate 16 caracteres). Ex: Lançamento, Pré-lançamento, Em breve.', placeholder: 'Ex: Lançamento' },
      { key: 'suggested_headline', label: 'Headline', type: 'text', required: true, maxLength: 40, helper: 'Quebra em ate 2 linhas brancas no painel (ate 40 caracteres). Foque no conceito/aspiração.', placeholder: 'Ex: O novo marco da Zona Sul', colSpan: 'full' },
      { key: 'location', label: 'Destaque (linha dourada)', type: 'text', required: true, maxLength: 30, helper: 'Bairro/região em dourado abaixo da headline (ate 30 caracteres). Ex: Bairro Tristeza · Porto Alegre.', placeholder: 'Ex: Bairro Tristeza · Porto Alegre', colSpan: 'full' },
      { key: 'differentials', label: 'Diferenciais (setas)', type: 'list', required: true, placeholder: '2 a 4 dormitórios\nLazer completo de clube\nEntrega prevista 2027', helper: 'Ate 3 itens — viram linhas com seta dourada. Mostre o que torna o lançamento desejável.', colSpan: 'full' },
      { key: 'price', label: 'Valor "a partir de"', type: 'money', helper: 'Opcional. Sem valor, a peça mostra "Pré-venda exclusiva".', placeholder: 'Ex: R$ 590.000,00' },
      { key: 'cta', label: 'Texto do botao', type: 'text', placeholder: 'Ex: Entrar na lista VIP', colSpan: 'full' },
    ],
  },
]

function vitraImobiliariaReference(prefix) {
  return {
    [TEMPLATE_FRAME_VARIANTS.noFrame]: [
      `/generated/vitra-imobiliaria/${prefix}-1x1-sem-moldura.png`,
      `/generated/vitra-imobiliaria/${prefix}-9x16-sem-moldura.png`,
      `/generated/vitra-imobiliaria/${prefix}-1-91x1-sem-moldura.png`,
    ],
    [TEMPLATE_FRAME_VARIANTS.goldFrame]: [
      `/generated/vitra-imobiliaria/${prefix}-1x1-com-moldura.png`,
      `/generated/vitra-imobiliaria/${prefix}-9x16-com-moldura.png`,
      `/generated/vitra-imobiliaria/${prefix}-1-91x1-com-moldura.png`,
    ],
  }
}

const templateVariationContracts = {
  dualPhotoOffer: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem a composicao aprovada e alterna somente argumento comercial, textos, CTA e ordem das fotos.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'safe_zone', 'format_grid'],
    mutableSlots: ['headline', 'subtitle', 'price', 'differentials', 'cta', 'photos'],
    recipes: [
      { id: 'oferta-direta', label: 'Oferta direta', phase: '1', angle: 'editorial', headline: '{headline_only}', copy: '{offer}. Imovel com informacao clara, fotos do produto e proximo passo simples.', cta: '{cta}' },
      { id: 'valor-comparativo', label: 'Valor comparativo', phase: '2', angle: 'investimento', headline: '{product}: valor para avaliar agora', copy: 'Compare preco, localizacao e diferenciais antes de decidir. A Vitra organiza as informacoes essenciais.', cta: 'Fale com a Vitra' },
      { id: 'localizacao-bairro', label: 'Localizacao e bairro', phase: '1', angle: 'localizacao', headline: '{product} em {place}', copy: 'A localizacao entra como criterio central da decisao. Veja fotos, pontos de interesse e condicoes do imovel.', cta: 'Receber informacoes' },
      { id: 'diferenciais-produto', label: 'Diferenciais do imovel', phase: '2', angle: 'diferenciais', headline: 'Diferenciais que ajudam na decisao', copy: '{details}. Uma leitura objetiva para entender se este imovel combina com sua busca.', cta: 'Conhecer diferenciais' },
      { id: 'decisao-rapida', label: 'Convite para avaliacao', phase: '3', angle: 'escassez', headline: 'Oportunidade para avaliar agora', copy: 'Alguns imoveis pedem uma avaliacao rapida e bem informada. Fale com a Vitra para confirmar disponibilidade.', cta: 'Avaliar agora' },
    ],
  },
  patiosGallery: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem galeria, setas e hierarquia aprovadas, variando chamada, ordem de beneficios e foto principal.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'benefit_arrows', 'photo_grid'],
    mutableSlots: ['headline', 'price', 'features', 'location', 'photos'],
    recipes: [
      { id: 'patios-suite', label: 'Configuracao forte', phase: '1', angle: 'diferenciais', headline: '{headline_only}', copy: '{details}. Destaques que ajudam a entender valor de uso e decisao.', cta: 'Fale com a Vitra' },
      { id: 'area-privativa', label: 'Area e uso', phase: '2', angle: 'arquitetura', headline: '{area} com boa leitura de uso', copy: 'Planta, area e rotina precisam fazer sentido juntos. Veja os principais pontos deste imovel.', cta: 'Ver detalhes' },
      { id: 'baixo-custo', label: 'Custo de moradia', phase: '2', angle: 'investimento', headline: 'Compra com criterio de custo e valor', copy: 'Compare valor, condominio e diferenciais antes de decidir. A Vitra ajuda nessa leitura.', cta: 'Comparar informacoes' },
      { id: 'localizacao-proxima', label: 'Proximidade', phase: '1', angle: 'localizacao', headline: '{product}: perto do que importa', copy: '{location}. Um argumento de localizacao para avaliar junto das fotos e caracteristicas.', cta: 'Conhecer localizacao' },
      { id: 'visita-decisao', label: 'Chamada para visita', phase: '3', angle: 'escassez', headline: 'Veja se este imovel encaixa na sua rotina', copy: 'Fotos, beneficios e localizacao reunidos para uma avaliacao mais rapida e objetiva.', cta: 'Agendar conversa' },
    ],
  },
  financiamentoOrla: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem bloco de financiamento, fotos duplas e preco aprovado; varia chamada, tese de oportunidade e bairro.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'price_box', 'rounded_photo_frames'],
    mutableSlots: ['headline', 'financing_claim', 'price', 'neighborhood', 'photos'],
    recipes: [
      { id: 'financiamento', label: 'Financiamento', phase: '1', angle: 'investimento', headline: '{headline_only}', copy: '{financing_claim}. Oportunidade para avaliar condicoes, bairro e fotos do empreendimento.', cta: 'Fale com a Vitra' },
      { id: 'preco-partida', label: 'Preco de partida', phase: '2', angle: 'investimento', headline: '{headline_only}', copy: 'Confira se esta faixa de valor faz sentido para sua busca e receba os detalhes com a Vitra.', cta: 'Receber detalhes' },
      { id: 'bairro', label: 'Bairro e localizacao', phase: '1', angle: 'localizacao', headline: '{product} em {neighborhood}', copy: 'Localizacao, fotos e condicoes em uma peca objetiva para comparar antes de decidir.', cta: 'Conhecer o bairro' },
      { id: 'primeira-compra', label: 'Primeira compra', phase: '2', angle: 'lifestyle', headline: 'Um caminho mais claro para comprar', copy: 'A Vitra organiza as informacoes do imovel para voce entender preco, fotos e proximos passos.', cta: 'Entender condicoes' },
      { id: 'urgencia', label: 'Avaliacao rapida', phase: '3', angle: 'escassez', headline: 'Avalie disponibilidade e condicoes', copy: 'Campanhas com preco de entrada pedem confirmacao rapida. Fale com a Vitra para seguir com seguranca.', cta: 'Confirmar disponibilidade' },
      { id: 'entrada-facilitada', label: 'Entrada facilitada', phase: '2', angle: 'investimento', headline: 'Condicoes de entrada facilitadas', copy: '{financing_claim}. Veja condicoes, bairro e fotos do empreendimento antes de decidir, com apoio da Vitra.', cta: 'Ver condicoes' },
      { id: 'localizacao-valoriza', label: 'Localizacao que valoriza', phase: '1', angle: 'localizacao', headline: 'Morar em {neighborhood} com bom acesso', copy: 'Localizacao, mobilidade e potencial de valorizacao reunidos. A Vitra ajuda a comparar antes da decisao.', cta: 'Conhecer a regiao' },
      { id: 'pronto-pra-morar', label: 'Pronto para morar', phase: '2', angle: 'lifestyle', headline: 'Pronto para morar, perto de tudo', copy: 'Imovel para entrar e morar: veja fotos, planta e condicoes em uma leitura objetiva e sem pressa.', cta: 'Receber detalhes' },
      { id: 'simulacao', label: 'Simulacao de condicoes', phase: '3', angle: 'curadoria', headline: 'Simule as condicoes deste imovel', copy: 'Receba uma simulacao clara de valor e condicoes para avaliar com seguranca. Fale com a Vitra.', cta: 'Simular agora' },
    ],
  },
  heroChecklist: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem foto de fundo, selos dourados e CTA amarelo aprovados; varia headline, preco De/Por, atributos e foto.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'safe_zone', 'badge_list', 'cta_button'],
    mutableSlots: ['headline', 'price', 'differentials', 'cta', 'photos'],
    recipes: [
      { id: 'oferta-de-por', label: 'Oferta De/Por', phase: '1', angle: 'investimento', headline: '{headline_only}', copy: 'Preco de tabela e preco de oportunidade lado a lado, com os atributos que sustentam o valor.', cta: '{cta}' },
      { id: 'checklist-atributos', label: 'Checklist de atributos', phase: '2', angle: 'diferenciais', headline: '{headline_only}', copy: '{details}. Lista objetiva para avaliar o imovel em poucos segundos.', cta: 'Receber mais informacoes' },
      { id: 'localizacao-referencia', label: 'Localizacao de referencia', phase: '1', angle: 'localizacao', headline: '{product} em {place}', copy: 'Endereco de referencia, fotos e condicoes reunidos para comparar antes de decidir.', cta: 'Conhecer a localizacao' },
      { id: 'preco-oportunidade', label: 'Preco de oportunidade', phase: '2', angle: 'investimento', headline: 'Valor de oportunidade para avaliar', copy: 'Compare o preco De/Por com imoveis semelhantes e confirme as condicoes com a Vitra.', cta: 'Confirmar condicoes' },
      { id: 'pronto-para-morar', label: 'Pronto para morar', phase: '2', angle: 'lifestyle', headline: 'Pronto para morar, perto de tudo', copy: 'Imovel para entrar e morar: atributos verificados e proximo passo simples com a Vitra.', cta: 'Receber detalhes' },
      { id: 'urgencia-visita', label: 'Convite para visita', phase: '3', angle: 'escassez', headline: 'Confirme a disponibilidade agora', copy: 'Oportunidades com preco reduzido pedem decisao informada e rapida. Fale com a Vitra.', cta: 'Agendar visita' },
    ],
  },
  duoSelos: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem composicao centralizada, pill De/Por, selos e CTA pill aprovados (com safe zone); varia headline, subtitulo, preco, selos e fotos.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'safe_zone', 'price_pill', 'badge_seals', 'cta_pill'],
    mutableSlots: ['headline', 'subtitle', 'price', 'differentials', 'cta', 'photos'],
    recipes: [
      { id: 'oferta-de-por', label: 'Oferta De/Por', phase: '1', angle: 'investimento', headline: '{headline_only}', copy: 'Preco de tabela e preco de oportunidade no mesmo quadro, com os beneficios que sustentam o valor.', cta: '{cta}' },
      { id: 'selos-beneficio', label: 'Selos de beneficio', phase: '2', angle: 'diferenciais', headline: '{headline_only}', copy: '{details}. Dois argumentos diretos para validar a oferta em segundos.', cta: 'Receber mais informacoes' },
      { id: 'bairro-coracao', label: 'Bairro em destaque', phase: '1', angle: 'localizacao', headline: '{product} em {place}', copy: 'Localizacao como argumento central: fotos, preco e beneficios reunidos para comparar antes de decidir.', cta: 'Conhecer a regiao' },
      { id: 'preco-comparativo', label: 'Preco comparativo', phase: '2', angle: 'investimento', headline: 'Compare o antes e o depois do preco', copy: 'O comparativo De/Por deixa a oportunidade explicita. Confirme as condicoes com a Vitra.', cta: 'Confirmar condicoes' },
      { id: 'lazer-completo', label: 'Lazer e infraestrutura', phase: '2', angle: 'lifestyle', headline: 'Lazer completo para o dia a dia', copy: 'Infraestrutura e conveniencia no mesmo endereco. Veja fotos e condicoes com a Vitra.', cta: 'Ver o lazer' },
      { id: 'urgencia-visita', label: 'Convite para visita', phase: '3', angle: 'escassez', headline: 'Confirme a disponibilidade agora', copy: 'Precos de oportunidade pedem decisao informada e rapida. Fale com a Vitra.', cta: 'Agendar visita' },
    ],
  },
  heroPanel: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem hero no topo, painel azul, setas e preco aprovados (com safe zone); varia headline, destaque, lista, preco e fotos.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'safe_zone', 'panel_gradient', 'arrow_list'],
    mutableSlots: ['headline', 'destaque', 'differentials', 'price', 'photos'],
    recipes: [
      { id: 'oportunidade-por', label: 'Oportunidade por', phase: '1', angle: 'investimento', headline: '{headline_only}', copy: 'Preco de oportunidade com os atributos que sustentam o valor, em uma leitura unica.', cta: 'Fale com a Vitra' },
      { id: 'lista-setas', label: 'Lista de atributos', phase: '2', angle: 'diferenciais', headline: '{headline_only}', copy: '{details}. Atributos objetivos para validar o imovel em segundos.', cta: 'Receber mais informacoes' },
      { id: 'destaque-localizacao', label: 'Destaque de localizacao', phase: '1', angle: 'localizacao', headline: '{product} em {place}', copy: 'A linha dourada destaca o argumento de localizacao; fotos e preco completam a leitura.', cta: 'Conhecer a localizacao' },
      { id: 'casa-condominio', label: 'Morar em condominio', phase: '2', angle: 'lifestyle', headline: 'Casa em condominio para a familia', copy: 'Espaco, seguranca e lazer no mesmo endereco. Veja fotos e condicoes com a Vitra.', cta: 'Ver a casa' },
      { id: 'visita-decisao', label: 'Convite para visita', phase: '3', angle: 'escassez', headline: 'Agende sua visita com a Vitra', copy: 'Imoveis com preco de oportunidade pedem decisao informada e rapida.', cta: 'Agendar visita' },
    ],
  },
  lancamento: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem foto hero, selo dourado e CTA aprovados (com safe zone); varia selo, headline, localizacao e CTA. Peca de expectativa, sem preco.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'safe_zone', 'tag_pill', 'cta_button'],
    mutableSlots: ['tag', 'headline', 'location', 'cta', 'photos'],
    recipes: [
      { id: 'lancamento', label: 'Lançamento', phase: '1', angle: 'lancamento', headline: '{headline_only}', copy: 'Acaba de chegar ao mercado. Conheça em primeira mão os diferenciais e as condições de lançamento com a Vitra.', cta: 'Entrar na lista VIP' },
      { id: 'pre-venda', label: 'Pré-venda exclusiva', phase: '2', angle: 'escassez', headline: 'Pré-venda exclusiva, por tempo limitado', copy: 'As melhores unidades saem primeiro. Garanta prioridade na pré-venda antes do lancamento oficial.', cta: 'Quero prioridade' },
      { id: 'condicoes', label: 'Condições de lançamento', phase: '2', angle: 'investimento', headline: '{product}: condições de lançamento', copy: 'Valores e condições de entrada exclusivos da fase de lancamento. Fale com a Vitra e simule.', cta: 'Receber condições' },
      { id: 'localizacao', label: 'Endereço em destaque', phase: '1', angle: 'localizacao', headline: '{product} em {place}', copy: 'Um lancamento no endereco que mais valoriza da regiao. Cadastre-se e acompanhe cada etapa.', cta: 'Conhecer a regiao' },
      { id: 'lista-vip', label: 'Lista VIP', phase: '3', angle: 'escassez', headline: 'Entre na lista VIP do lançamento', copy: 'Vagas limitadas: a lista VIP tem acesso antecipado a plantas, condicoes e melhores unidades.', cta: 'Entrar na lista VIP' },
    ],
  },
  meninoDeus: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem foto protagonista, tarjas navy e bloco comercial claro; varia bairro, argumento e diferencais.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'official_blue_bands', 'address_lockup'],
    mutableSlots: ['hero_photo', 'neighborhood', 'headline', 'price', 'condo_argument', 'features', 'address'],
    recipes: [
      { id: 'bairro-destaque', label: 'Bairro em destaque', phase: '1', angle: 'localizacao', headline: 'Oportunidade em {neighborhood}', copy: '{location}. Uma leitura objetiva para quem quer morar ou investir com apoio da Vitra.', cta: 'Fale com a Vitra' },
      { id: 'valor-condominio', label: 'Valor e condominio', phase: '2', angle: 'investimento', headline: '{product}: compare custo e valor', copy: 'Preco, condominio e diferenciais reunidos para uma decisao mais segura.', cta: 'Comparar detalhes' },
      { id: 'suite-configuracao', label: 'Configuracao do imovel', phase: '2', angle: 'diferenciais', headline: '{suites}', copy: '{details}. Veja se a configuracao faz sentido para sua rotina.', cta: 'Ver configuracao' },
      { id: 'foto-protagonista', label: 'Foto protagonista', phase: '1', angle: 'lifestyle', headline: 'Veja o imovel antes de decidir', copy: 'A foto principal conduz a primeira leitura. Depois, a Vitra ajuda a validar valor, bairro e proximos passos.', cta: 'Receber fotos' },
      { id: 'convite-visita', label: 'Convite para visita', phase: '3', angle: 'escassez', headline: 'Confirme se ainda esta disponivel', copy: 'Se a localizacao e o valor fazem sentido, o proximo passo e validar disponibilidade com a Vitra.', cta: 'Confirmar disponibilidade' },
    ],
  },
}

export const CREATIVE_TEMPLATE_CATALOG = {
  [BRAND_SCOPES.premium]: [
    {
      id: 'premium-auto-editorial',
      family: null,
      mode: 'auto_by_angle',
      name: 'Sistema editorial Premium',
      shortName: 'Automatico Premium',
      bestFor: 'Campanhas de alto padrao com variacao por objetivo, etapa e angulo de venda.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: 'auto',
      variants: [{ id: 'auto', label: 'Automatico', frame: 'auto' }],
      preview: null,
      fieldGroups: commonPremiumFieldGroups,
      imageSlots: DEFAULT_TEMPLATE_IMAGE_SLOTS,
      variableFields: ['photos', 'headline', 'copy', 'differentials', 'cta'],
      fixedBrandRules: ['black_gold', 'premium_positioning', 'editorial_hierarchy'],
    },
    {
      id: 'vitra-premium-lancamento',
      family: 'vitra-premium-lancamento',
      mode: 'single_family',
      name: 'Lançamento / Pré-lançamento',
      shortName: 'Lançamento Premium (teaser)',
      bestFor: 'Teaser editorial de lançamento de alto padrão (preto + dourado): foto hero + painel preto institucional com selo de lançamento, headline + destaque dourado, diferenciais com setas, "a partir de" e CTA Lista VIP. Topo de funil com exclusividade — capta interessados antes do lancamento.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-premium/template-08-lancamento-premium-1x1-sem-moldura.png',
      fieldGroups: lancamentoFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto hero (única)', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.lancamento,
      references: {
        [TEMPLATE_FRAME_VARIANTS.noFrame]: [
          '/generated/vitra-premium/template-08-lancamento-premium-1x1-sem-moldura.png',
          '/generated/vitra-premium/template-08-lancamento-premium-9x16-sem-moldura.png',
          '/generated/vitra-premium/template-08-lancamento-premium-1-91x1-sem-moldura.png',
        ],
        [TEMPLATE_FRAME_VARIANTS.goldFrame]: [
          '/generated/vitra-premium/template-08-lancamento-premium-1x1-com-moldura.png',
          '/generated/vitra-premium/template-08-lancamento-premium-9x16-com-moldura.png',
          '/generated/vitra-premium/template-08-lancamento-premium-1-91x1-com-moldura.png',
        ],
      },
      variableFields: ['photos', 'tag', 'headline', 'destaque', 'differentials', 'price', 'cta'],
      fixedBrandRules: ['black_gold', 'premium_institutional_panel', 'gold_launch_seal', 'gold_arrow_list', 'gold_cta_pill', 'meta_safe_zone'],
    },
  ],
  [BRAND_SCOPES.imobiliaria]: [
    {
      id: 'vitra-imobiliaria-dual-photo-offer',
      family: 'vitra-imobiliaria-dual-photo-offer',
      mode: 'single_family',
      // Aposentado da selecao do modal Nova Campanha (junho/2026): a arte nao ficou boa o suficiente.
      // Continua no catalogo para que campanhas/assets ja criados com esta family resolvam e renderizem.
      hidden: true,
      name: 'Oferta com duas fotos',
      shortName: 'Duas fotos + oferta',
      bestFor: 'Promocoes, preco com comparativo, campanhas de bairro e chamadas diretas de conversao.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1x1-sem-moldura.png',
      fieldGroups: dualPhotoOfferFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto esquerda / fachada', multiple: false, required: true },
        { id: 'living', label: 'Foto direita / lazer', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.dualPhotoOffer,
      references: {
        [TEMPLATE_FRAME_VARIANTS.noFrame]: [
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1x1-sem-moldura.png',
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-9x16-sem-moldura.png',
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1-91x1-sem-moldura.png',
        ],
        [TEMPLATE_FRAME_VARIANTS.goldFrame]: [
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1x1-com-moldura.png',
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-9x16-com-moldura.png',
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1-91x1-com-moldura.png',
        ],
      },
      variableFields: ['photos', 'headline', 'description', 'price', 'differentials', 'cta'],
      fixedBrandRules: ['navy_gold', 'approved_horizontal_logo', '135px_safe_zone', 'thin_gold_frame_optional'],
    },
    {
      id: 'vitra-imobiliaria-patios-gallery',
      family: 'vitra-imobiliaria-patios-gallery',
      mode: 'single_family',
      hidden: true, // Aposentado da selecao do modal (junho/2026) — ver nota no dual-photo-offer.
      name: 'Galeria com beneficios',
      shortName: 'Patios + galeria',
      bestFor: 'Imoveis com varios ambientes, lista de beneficios e argumento de proximidade/localizacao.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.goldFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-02-patios-galeria-1x1-com-moldura.png',
      fieldGroups: patiosGalleryFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto 1 / ambiente principal', multiple: false, required: true },
        { id: 'living', label: 'Foto 2 / area externa', multiple: false, required: true },
        { id: 'varanda', label: 'Foto 3 / detalhe complementar', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.patiosGallery,
      references: vitraImobiliariaReference('template-02-patios-galeria'),
      variableFields: ['photos', 'headline', 'price', 'features', 'location'],
      fixedBrandRules: ['navy_gold', 'approved_horizontal_logo', 'safe_zone', 'benefit_arrows'],
    },
    {
      id: 'vitra-imobiliaria-financiamento-orla',
      family: 'vitra-imobiliaria-financiamento-orla',
      mode: 'single_family',
      hidden: true, // Aposentado da selecao do modal (junho/2026) — ver nota no dual-photo-offer.
      name: 'Financiamento e oportunidade',
      shortName: 'Financiamento Orla',
      bestFor: 'Campanhas de entrada, Minha Casa Minha Vida removido, preco de oportunidade e bairro.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-03-financiamento-orla-1x1-sem-moldura.png',
      fieldGroups: financiamentoOrlaFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto esquerda / localizacao', multiple: false, required: true },
        { id: 'living', label: 'Foto direita / empreendimento', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.financiamentoOrla,
      references: vitraImobiliariaReference('template-03-financiamento-orla'),
      variableFields: ['photos', 'headline', 'financing_claim', 'price', 'neighborhood'],
      fixedBrandRules: ['navy_gold', 'approved_horizontal_logo', 'rounded_photo_frames', 'price_box'],
      // render-version (cache-busting): bump quando a ARTE deste template muda, para forcar
      // re-render dos PNGs ja em storage. So esta family foi iterada ate aqui; as outras 3
      // ficam sem renderVersion (nao disparam re-render retroativo). Fonte unica no catalogo.
      renderVersion: 'financiamento-orla-approved-v7',
    },
    {
      id: 'vitra-imobiliaria-menino-deus-offer',
      family: 'vitra-imobiliaria-menino-deus-offer',
      mode: 'single_family',
      hidden: true, // Aposentado da selecao do modal (junho/2026) — ver nota no dual-photo-offer.
      name: 'Oferta com foto protagonista',
      shortName: 'Menino Deus',
      bestFor: 'Imovel com foto forte, chamada por bairro, tarja de configuracao e bloco comercial claro.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-04-menino-deus-1x1-sem-moldura.png',
      fieldGroups: meninoDeusFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto protagonista', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.meninoDeus,
      references: vitraImobiliariaReference('template-04-menino-deus'),
      variableFields: ['hero_photo', 'neighborhood', 'headline', 'price', 'condo_argument', 'features', 'address'],
      fixedBrandRules: ['navy_offwhite', 'official_blue_bands', 'approved_logo', 'address_lockup'],
    },
    {
      id: 'vitra-imobiliaria-hero-checklist',
      family: 'vitra-imobiliaria-hero-checklist',
      mode: 'single_family',
      name: 'Foto de fundo com checklist',
      shortName: 'New Life (foto + checklist)',
      bestFor: 'Oferta direta com preco De/Por, checklist de atributos com selo dourado e CTA amarelo sobre foto unica do imovel.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-05-hero-checklist-1x1-sem-moldura.png',
      fieldGroups: heroChecklistFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto de fundo (unica)', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.heroChecklist,
      references: vitraImobiliariaReference('template-05-hero-checklist'),
      variableFields: ['photos', 'headline', 'price_from', 'price', 'differentials', 'cta'],
      fixedBrandRules: ['navy_overlay_photo', 'approved_white_wordmark', 'gold_badge_checklist', 'yellow_cta', 'meta_safe_zone'],
      // Arte nova (junho/2026), versionada desde o inicio: referencia aprovada e a peca
      // "New Life - Av. Ipiranga" (criativos-aprovados-vitra-imobiliaria/new life.jpeg).
      // v2 (junho/2026): reposicionado para dentro da safe zone do Meta nos 3 formatos (logo fora
      // do canto, CTA fora das faixas de reels/base, margem esquerda em 108/89). O bump forca o
      // re-render dos PNGs ja em storage com a arte corrigida.
      renderVersion: 'hero-checklist-safezone-v2',
    },
    {
      id: 'vitra-imobiliaria-duo-selos-offer',
      family: 'vitra-imobiliaria-duo-selos-offer',
      mode: 'single_family',
      name: 'Oferta duo com selos',
      shortName: 'Zona Norte (duo + selos)',
      bestFor: 'Oferta centralizada com preco De/Por em pill, duas fotos grandes lado a lado e selos de beneficio — fiel a peca aprovada da Zona Norte, com safe zone do Meta.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-06-duo-selos-1x1-sem-moldura.png',
      fieldGroups: duoSelosFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto esquerda / empreendimento', multiple: false, required: true },
        { id: 'living', label: 'Foto direita / lazer', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.duoSelos,
      references: vitraImobiliariaReference('template-06-duo-selos'),
      variableFields: ['photos', 'headline', 'subtitle', 'price_from', 'price', 'differentials', 'cta'],
      fixedBrandRules: ['navy_gold', 'approved_white_wordmark', 'price_pill', 'gold_badge_seals', 'meta_safe_zone'],
      // Arte nova (junho/2026), versionada desde o inicio: referencia aprovada e a peca da
      // campanha Zona Norte (criativos-aprovados-vitra-imobiliaria/2fe17ff8 e f38e4f2b), adaptada
      // ao brandbook (navy+dourado) e as safe zones do Meta (skill margem-seguranca-criativos).
      renderVersion: 'duo-selos-approved-v1',
    },
    {
      id: 'vitra-imobiliaria-hero-panel-gallery',
      family: 'vitra-imobiliaria-hero-panel-gallery',
      mode: 'single_family',
      name: 'Hero com painel e galeria',
      shortName: 'San Clemente (hero + painel)',
      bestFor: 'Imovel com foto forte no topo, painel azul com headline + destaque dourado, lista de setas, preco de oportunidade e galeria lateral — fiel a peca aprovada do San Clemente, com safe zone do Meta.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-07-hero-panel-1x1-sem-moldura.png',
      fieldGroups: heroPanelFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto hero (topo)', multiple: false, required: true },
        { id: 'living', label: 'Foto lateral 1 / interior', multiple: false, required: true },
        { id: 'infraestrutura', label: 'Foto lateral 2 / lazer', multiple: false },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.heroPanel,
      references: vitraImobiliariaReference('template-07-hero-panel'),
      variableFields: ['photos', 'headline', 'destaque', 'differentials', 'price'],
      fixedBrandRules: ['navy_blue_panel', 'approved_white_wordmark', 'gold_arrow_list', 'meta_safe_zone'],
      // Arte nova (junho/2026), versionada desde o inicio: referencia aprovada e a peca da
      // campanha San Clemente (criativos-aprovados-vitra-imobiliaria/1040ccb5 e 83b3c406), com o
      // painel na familia azul do brandbook e amarelo -> dourado (skill margem-seguranca-criativos).
      renderVersion: 'hero-panel-approved-v1',
    },
    {
      id: 'vitra-imobiliaria-lancamento',
      family: 'vitra-imobiliaria-lancamento',
      mode: 'single_family',
      name: 'Lançamento / Em breve',
      shortName: 'Lançamento (teaser)',
      bestFor: 'Teaser editorial de lançamento/pré-lançamento: foto hero + painel navy institucional com selo dourado, headline + destaque, diferenciais com setas, "a partir de" e CTA Lista VIP. Topo de funil com escassez/exclusividade — capta interessados antes do lancamento.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-08-lancamento-1x1-sem-moldura.png',
      fieldGroups: lancamentoFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto hero (única)', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.lancamento,
      references: vitraImobiliariaReference('template-08-lancamento'),
      variableFields: ['photos', 'tag', 'headline', 'destaque', 'differentials', 'price', 'cta'],
      fixedBrandRules: ['navy_institutional_panel', 'approved_white_wordmark', 'gold_launch_seal', 'gold_arrow_list', 'gold_cta_pill', 'meta_safe_zone'],
      // v2 (junho/2026): redesenho para densidade estrategica no nivel do San Clemente — painel navy
      // institucional + selo de lancamento + diferenciais com setas + "a partir de"/preco + CTA Lista VIP.
      // O bump forca o re-render dos PNGs ja em storage com a arte nova.
      renderVersion: 'lancamento-approved-v2',
    },
  ],
}

export function creativeTemplatesForBrand(brandScope) {
  return CREATIVE_TEMPLATE_CATALOG[brandScope] || CREATIVE_TEMPLATE_CATALOG[BRAND_SCOPES.premium]
}

// Templates oferecidos na selecao do modal Nova Campanha. Oculta os aposentados (`hidden: true`)
// sem remove-los do catalogo — assim a UI mostra so os aprovados, mas campanhas/assets ja criados
// com uma family oculta continuam resolvendo (getCreativeTemplateById, render, render-version).
export function selectableCreativeTemplatesForBrand(brandScope) {
  return creativeTemplatesForBrand(brandScope).filter(template => !template.hidden)
}

export function defaultCreativeTemplateForBrand(brandScope) {
  const selectable = selectableCreativeTemplatesForBrand(brandScope)
  return selectable[0] || creativeTemplatesForBrand(brandScope)[0] || null
}

export function getCreativeTemplateById(brandScope, templateId) {
  const templates = creativeTemplatesForBrand(brandScope)
  return templates.find(template => template.id === templateId) || defaultCreativeTemplateForBrand(brandScope)
}

export function normalizeCreativeTemplateSelection(brandScope, templateId, variantId) {
  const template = getCreativeTemplateById(brandScope, templateId)
  const variant = template?.variants?.find(item => item.id === variantId) ||
    template?.variants?.find(item => item.id === template.defaultVariant) ||
    template?.variants?.[0] ||
    null

  return { template, variant }
}

export function templateFamilyFromTemplateKey(templateKey) {
  const key = String(templateKey || '')
  const suffix = FORMAT_SUFFIXES.find(format => key.endsWith(`-${format}`))
  return suffix ? key.slice(0, -suffix.length - 1) : key
}

export function creativeTemplateForTemplateKey(brandScope, templateKey) {
  const family = templateFamilyFromTemplateKey(templateKey)
  return creativeTemplatesForBrand(brandScope).find(template => template.family === family) || null
}

export function isApprovedTemplateKeyForBrand(brandScope, templateKey) {
  return Boolean(creativeTemplateForTemplateKey(brandScope, templateKey))
}

export function referencesForTemplateVariant(template, variantId) {
  if (!template?.references) return []
  return template.references[variantId] || template.references[template.defaultVariant] || []
}

export function fieldGroupsForTemplate(template) {
  return template?.fieldGroups?.length ? template.fieldGroups : []
}

export function fieldsForTemplate(template) {
  return fieldGroupsForTemplate(template).flatMap(group => group.fields || [])
}

export function formKeyForTemplateField(field) {
  return field?.formKey || field?.key
}

export function imageSlotsForTemplate(template) {
  return template?.imageSlots?.length ? template.imageSlots : DEFAULT_TEMPLATE_IMAGE_SLOTS
}

export function variationContractForTemplate(template) {
  return template?.variationContract || {
    strategy: 'default_template_slots_only',
    description: 'Mantem o template selecionado e varia apenas os campos preenchidos no brief.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette'],
    mutableSlots: template?.variableFields || ['photos', 'headline', 'copy', 'cta'],
    recipes: [],
  }
}

export function variationRecipesForTemplate(template) {
  return variationContractForTemplate(template).recipes || []
}

// Fonte unica do render-version (cache-busting) por family: derivado do campo `renderVersion`
// dos proprios templates do catalogo, em vez de um literal solto duplicado. Somente families
// com bump explicito entram no mapa; as demais ficam fora (sem disparo de re-render).
// (Fase 3) A Edge mantem um espelho proprio — o teste de guarda evita divergencia.
export function renderVersionForFamily(family) {
  if (!family) return null
  for (const templates of Object.values(CREATIVE_TEMPLATE_CATALOG)) {
    const match = templates.find(template => template.family === family)
    if (match?.renderVersion) return match.renderVersion
  }
  return null
}

export const VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION = Object.fromEntries(
  creativeTemplatesForBrand(BRAND_SCOPES.imobiliaria)
    .filter(template => template.renderVersion)
    .map(template => [template.family, template.renderVersion]),
)

export function frameForTemplateVariant(template, variantId) {
  const variant = template?.variants?.find(item => item.id === variantId) ||
    template?.variants?.find(item => item.id === template?.defaultVariant)
  return variant?.frame || 'none'
}
