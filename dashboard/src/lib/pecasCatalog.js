import { Facebook, Linkedin, Youtube, Instagram, MessageCircle, Mail, PartyPopper, Contact, BadgeCheck } from 'lucide-react'
import { BRAND_SCOPES } from './brandProfiles.js'

// Catálogo único e data-driven das peças (capas/banners) por plataforma.
// Estrutura escalável: adicionar uma plataforma = novo objeto aqui; adicionar um
// formato = novo item em `formats`; nova marca = nova chave em `variants`.
// Os geradores ficam espelhados em /public/pecas (npm run sync:pecas).

export const PECA_STATUS = { available: 'available', soon: 'soon' }

// Base servida pelo Vite (public/pecas). Respeita import.meta.env.BASE_URL no consumidor.
export const PECAS_ASSET_BASE = 'pecas/'

export const PECAS_PLATFORMS = [
  {
    id: 'institucional',
    label: 'Marketing Institucional',
    icon: BadgeCheck,
    status: PECA_STATUS.available,
    summary: 'Peças de autoridade e prova social da Vitra (vendas, marcos, credibilidade) para o mercado.',
    formats: [
      {
        id: 'imovel-vendido',
        label: 'Imóvel Vendido',
        status: PECA_STATUS.available,
        w: 1080,
        h: 1350,
        ratio: 'multi · 4:5 · 9:16 · 1:1',
        safeArea: 'centro · escolha o formato dentro do gerador',
        note: 'Prova social de venda concluída (sem dados do imóvel/cliente): selo VENDIDO + mensagem editável (presets) + complemento + imagem institucional opcional. Feed 4:5, Story 9:16, WhatsApp 1:1.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'imovel-vendido-institucional-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'imovel-vendido-institucional-vitra-premium.html',
        },
      },
      {
        id: 'imovel-vendido-video',
        label: 'Imóvel Vendido (vídeo)',
        status: PECA_STATUS.available,
        w: 1080,
        h: 1920,
        ratio: 'vídeo · 9:16 · 4:5',
        safeArea: 'centro livre · escolha o formato dentro do gerador',
        note: 'Versão em VÍDEO: suba o clipe do corretor tocando o sino e a máscara navy+dourado é aplicada por cima sem cobrir o centro (marca d\'água centralizada + carimbo VENDIDO + degradê na headline). Corte início/fim, enquadramento (zoom/arraste), áudio original + trilha opcional, capa PNG e export 9:16 (Reels/Stories/Status) e 4:5 (Feed). Processamento no navegador. Imobiliária.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'imovel-vendido-video-vitra-imobiliaria.html',
        },
      },
    ],
  },
  {
    id: 'cracha',
    label: 'Crachá Corporativo',
    icon: Contact,
    status: PECA_STATUS.available,
    summary: 'Crachá em PVC (CR-80 vertical) fiel ao brandbook — frente + verso, pronto para Canva e gráfica.',
    formats: [
      {
        id: 'corporativo',
        label: 'Crachá (frente + verso)',
        status: PECA_STATUS.available,
        w: 638,
        h: 1004,
        ratio: '5,4 × 8,5 cm · CR-80 · PVC',
        safeArea: 'sangria 2 mm · corte 5,4×8,5 cm · segurança 4 mm',
        note: 'Padrão oficial do brandbook (navy + dourado, foto circular, slot oval). Foto com recorte/zoom, nome/cargo/setor/matrícula, QR no verso, geração em lote. Exporta PNG 685×1051 px @300 DPI (com sangria) para Canva e impressão PVC.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'cracha-corporativo-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'cracha-corporativo-vitra-premium.html',
        },
      },
    ],
  },
  {
    id: 'interno',
    label: 'Comunicação Interna',
    icon: PartyPopper,
    status: PECA_STATUS.available,
    summary: 'Endomarketing: convites de eventos, aniversariantes, comunicados e metas para fortalecer o time.',
    formats: [
      {
        id: 'evento',
        label: 'Convite de evento',
        status: PECA_STATUS.available,
        w: 1080,
        h: 1350,
        ratio: 'multi · 4:5 · 9:16 · 1:1',
        safeArea: 'centro · escolha o formato dentro do gerador',
        note: 'Multiformato: Feed 4:5, Stories/Status 9:16 e Post 1:1 num só gerador. Textos editáveis ao vivo; suba a foto do ambiente como fundo. WhatsApp = Stories/Status ou Post; Instagram = Feed ou Stories.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'evento-interno-vitra-imobiliaria.html',
        },
      },
      {
        id: 'aniversariantes',
        label: 'Aniversariantes do mês',
        status: PECA_STATUS.available,
        w: 1080,
        h: 1350,
        ratio: 'multi · 4:5 · 9:16 · 1:1',
        safeArea: 'centro · escolha o formato dentro do gerador',
        note: 'Lista de aniversariantes (dia + nome) editável, com mês e mensagem de felicitação. Multiformato + foto opcional.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'aniversariantes-interno-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'aniversariantes-interno-vitra-premium.html',
        },
      },
      {
        id: 'comunicado',
        label: 'Comunicado interno',
        status: PECA_STATUS.available,
        w: 1080,
        h: 1350,
        ratio: 'multi · 4:5 · 9:16 · 1:1',
        safeArea: 'centro · escolha o formato dentro do gerador',
        note: 'Aviso oficial: selo "Comunicado", título, mensagem e assinatura — tudo editável. Multiformato + foto opcional.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'comunicado-interno-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'comunicado-interno-vitra-premium.html',
        },
      },
      {
        id: 'metas',
        label: 'Metas batidas',
        status: PECA_STATUS.available,
        w: 1080,
        h: 1350,
        ratio: 'multi · 4:5 · 9:16 · 1:1',
        safeArea: 'centro · escolha o formato dentro do gerador',
        note: 'Celebração de resultado: número/percentual da meta em destaque + parabéns ao time. Multiformato + foto opcional.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'metas-interno-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'metas-interno-vitra-premium.html',
        },
      },
      {
        id: 'boas-vindas',
        label: 'Boas-vindas (novo colaborador)',
        status: PECA_STATUS.available,
        w: 1080,
        h: 1350,
        ratio: 'multi · 4:5 · 9:16 · 1:1',
        safeArea: 'centro · escolha o formato dentro do gerador',
        note: 'Apresenta o novo integrante: nome em destaque, cargo/equipe e mensagem de boas-vindas. Multiformato + foto do colaborador/ambiente.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'boas-vindas-interno-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'boas-vindas-interno-vitra-premium.html',
        },
      },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    status: PECA_STATUS.available,
    summary: 'Capa do perfil e da página da Vitra no Facebook.',
    formats: [
      {
        id: 'capa',
        label: 'Capa',
        status: PECA_STATUS.available,
        w: 820,
        h: 360,
        ratio: '2,28 : 1',
        safeArea: '640 × 312 px (centro)',
        note: 'No celular a imagem estica e esconde as laterais; o canto inferior esquerdo fica sob a foto do perfil.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'capa-facebook-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'capa-facebook-vitra-premium.html',
        },
      },
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    status: PECA_STATUS.available,
    summary: 'Capas de perfil pessoal e de página/empresa no LinkedIn.',
    formats: [
      {
        id: 'perfil',
        label: 'Capa de perfil',
        status: PECA_STATUS.available,
        w: 1584,
        h: 396,
        ratio: '4 : 1',
        safeArea: 'centro · foto no canto inferior esquerdo',
        note: 'Perfil pessoal — nome e cargo editáveis ao vivo dentro do gerador.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'linkedin-perfil-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'linkedin-perfil-vitra-premium.html',
        },
      },
      {
        id: 'pagina',
        label: 'Capa de página',
        status: PECA_STATUS.available,
        w: 1128,
        h: 191,
        ratio: '5,9 : 1',
        safeArea: 'centro · logo da página no canto inferior esquerdo',
        note: 'Página/empresa — marca + assinatura, sem dados pessoais.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'linkedin-pagina-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'linkedin-pagina-vitra-premium.html',
        },
      },
    ],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    status: PECA_STATUS.available,
    summary: 'Banner do canal com fundo full-bleed (a TV mostra a tela inteira).',
    formats: [
      {
        id: 'banner',
        label: 'Banner do canal',
        status: PECA_STATUS.available,
        w: 2560,
        h: 1440,
        ratio: '16 : 9',
        safeArea: '1546 × 423 px (centro)',
        note: 'Celular mostra só o centro; desktop um pouco mais; TV mostra tudo — por isso o fundo preenche a tela.',
        variants: {
          [BRAND_SCOPES.imobiliaria]: 'capa-youtube-vitra-imobiliaria.html',
          [BRAND_SCOPES.premium]: 'capa-youtube-vitra-premium.html',
        },
      },
    ],
  },

  // ===== Áreas de geração futura (roadmap) =====
  {
    id: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    status: PECA_STATUS.soon,
    summary: 'Feed, retrato e Stories/Reels nas duas marcas.',
    formats: [
      { id: 'feed', label: 'Post de feed', status: PECA_STATUS.soon, w: 1080, h: 1080, ratio: '1 : 1' },
      { id: 'retrato', label: 'Feed retrato', status: PECA_STATUS.soon, w: 1080, h: 1350, ratio: '4 : 5' },
      { id: 'story', label: 'Story / Reels', status: PECA_STATUS.soon, w: 1080, h: 1920, ratio: '9 : 16' },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    status: PECA_STATUS.soon,
    summary: 'Foto de perfil comercial e imagens de status.',
    formats: [
      { id: 'perfil', label: 'Foto de perfil', status: PECA_STATUS.soon, w: 640, h: 640, ratio: '1 : 1' },
      { id: 'status', label: 'Status', status: PECA_STATUS.soon, w: 1080, h: 1920, ratio: '9 : 16' },
    ],
  },
  {
    id: 'email',
    label: 'E-mail',
    icon: Mail,
    status: PECA_STATUS.soon,
    summary: 'Assinatura e cabeçalho de e-mail marketing.',
    formats: [
      { id: 'assinatura', label: 'Assinatura', status: PECA_STATUS.soon, w: 600, h: 200, ratio: '3 : 1' },
      { id: 'header', label: 'Cabeçalho (newsletter)', status: PECA_STATUS.soon, w: 600, h: 200, ratio: '3 : 1' },
    ],
  },
]

export function getPlatform(id) {
  return PECAS_PLATFORMS.find(platform => platform.id === id) || null
}

export function countFormats(platform) {
  return platform?.formats?.length || 0
}

// URL pública do gerador de um formato para uma marca (ou null se indisponível).
export function generatorUrl(format, brandScope, baseUrl = '/') {
  const file = format?.variants?.[brandScope]
  if (!file) return null
  return `${baseUrl}${PECAS_ASSET_BASE}${file}`
}
