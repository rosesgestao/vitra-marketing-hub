// Playbook EDITORIAL (conteudo organico) — FONTE UNICA, no mesmo padrao do objectivePlaybook (pago).
// O operador escolhe UM tipo de conteudo + (opcional) pilar/formato/tom; o resto (foco de funil, dica
// para a IA, formato sugerido) e DERIVADO daqui. Pilares/tipos/formatos sao NEUTROS de marca — a VOZ
// (Imobiliaria x Premium) e aplicada na edge generate-content. Mantem a padronizacao: nenhum caminho
// ad-hoc por tipo na UI/edge.
//
// Puro TS (sem Deno/Vite APIs) — importado pela Edge (Deno) E pelo dashboard (Vite), igual a
// copyValidation.ts / objectivePlaybook.ts.

export interface ContentPillar {
  key: string;
  label: string;
  funnel: string;       // etapa de funil que o pilar costuma servir
  description: string;  // o que o pilar comunica (guia a IA e o operador)
}

// `offer` = vinculo com uma oferta/imovel: "required" (o post E sobre uma oferta especifica),
// "suggested" (fala de imovel/oportunidade — vincular ajuda, mas nao obriga) ou "none" (conteudo de
// marca: institucional, bastidores, educativo, autoridade — nasce SEM oferta). Dirige a obrigatoriedade
// contextual do campo "Oferta vinculada" na aba Produção.
export type ContentOfferLink = "required" | "suggested" | "none";

export interface ContentType {
  key: string;
  label: string;
  pillar: string;       // pilar editorial default
  format: string;       // formato sugerido (key de CONTENT_FORMATS)
  funnel: string;
  offer: ContentOfferLink; // vinculo com oferta/imovel
  hint: string;         // orientacao para a IA gerar o conteudo
}

export interface ContentFormat {
  key: string;
  label: string;
  spec: string;         // dimensao/observacao do formato
  hasScript: boolean;   // se pede roteiro (reels/stories)
}

// ---- Pilares editoriais (demanda receptiva: presenca, autoridade, relacionamento) ----
export const CONTENT_PILLARS: Record<string, ContentPillar> = {
  autoridade:   { key: "autoridade",   label: "Autoridade imobiliaria", funnel: "topo/meio", description: "mercado, dados, tendencias e por que confiar na Vitra" },
  educativo:    { key: "educativo",    label: "Educar o comprador",     funnel: "topo",      description: "duvidas comuns: financiamento, documentacao, primeiro imovel, passo a passo" },
  bastidores:   { key: "bastidores",   label: "Bastidores e relacionamento", funnel: "relacionamento", description: "time, rotina, humanizacao da marca, proximidade" },
  prova_social: { key: "prova_social", label: "Prova social",           funnel: "meio/fundo", description: "depoimentos, chaves entregues, clientes satisfeitos, resultados" },
  imovel:       { key: "imovel",       label: "Imovel em destaque",     funnel: "fundo",     description: "apresentar um imovel/empreendimento e seus diferenciais" },
  oportunidade: { key: "oportunidade", label: "Oportunidade",           funnel: "fundo",     description: "condicao, disponibilidade e o momento de decidir" },
  captacao:     { key: "captacao",     label: "Captacao de proprietario", funnel: "aquisicao", description: "quem quer vender/alugar: anuncie seu imovel com a Vitra" },
  localizacao:  { key: "localizacao",  label: "Bairro e localizacao",   funnel: "topo/meio", description: "regioes, valorizacao e lifestyle do bairro" },
};

// ---- Tipos de conteudo (intencao editorial) ----
export const CONTENT_TYPES: Record<string, ContentType> = {
  institucional:   { key: "institucional",   label: "Post institucional",        pillar: "autoridade",   format: "feed",      funnel: "topo",       offer: "none",      hint: "reforca o posicionamento e os valores da marca; institucional, sem oferta direta" },
  imovel:          { key: "imovel",           label: "Post de imovel",            pillar: "imovel",       format: "carrossel", funnel: "fundo",      offer: "suggested", hint: "apresenta um imovel/empreendimento: diferenciais, planta, bairro; usa os fatos fornecidos" },
  bastidores:      { key: "bastidores",       label: "Post de bastidores",        pillar: "bastidores",   format: "reels",     funnel: "relacionamento", offer: "none",  hint: "humaniza a marca: rotina do time, atendimento, dia a dia da operacao" },
  educativo:       { key: "educativo",        label: "Post educativo",            pillar: "educativo",    format: "carrossel", funnel: "topo",       offer: "none",      hint: "ensina algo util ao comprador (financiamento, documentacao, dicas), gerando autoridade" },
  autoridade:      { key: "autoridade",       label: "Post de autoridade",        pillar: "autoridade",   format: "feed",      funnel: "meio",       offer: "none",      hint: "dados/analise de mercado, tendencias, leitura do momento imobiliario" },
  oportunidade:    { key: "oportunidade",     label: "Post de oportunidade",      pillar: "oportunidade", format: "feed",      funnel: "fundo",      offer: "suggested", hint: "destaca uma condicao/disponibilidade e convida a agir (sem tom de promocao barata)" },
  prova_social:    { key: "prova_social",     label: "Post de prova social",      pillar: "prova_social", format: "carrossel", funnel: "meio/fundo", offer: "suggested", hint: "depoimento, entrega de chaves, historia de cliente; constroi confianca" },
  captacao:        { key: "captacao",         label: "Captacao de proprietario",  pillar: "captacao",     format: "feed",      funnel: "aquisicao",  offer: "none",      hint: "fala com quem quer VENDER/alugar: anuncie com a Vitra; foco em seguranca e alcance" },
  parcerias_b2b:   { key: "parcerias_b2b",    label: "Construtoras e incorporadoras", pillar: "autoridade", format: "feed",   funnel: "B2B",        offer: "none",      hint: "fala com construtoras/incorporadoras: parceria de vendas, performance, estrutura da Vitra" },
  lifestyle_bairro:{ key: "lifestyle_bairro", label: "Bairro e lifestyle",        pillar: "localizacao",  format: "carrossel", funnel: "topo/meio",  offer: "none",      hint: "explora a regiao/bairro: valorizacao, conveniencias, estilo de vida" },
};

// ---- Formatos de entrega ----
export const CONTENT_FORMATS: Record<string, ContentFormat> = {
  feed:      { key: "feed",      label: "Post unico (feed)", spec: "1:1 1080x1080",        hasScript: false },
  carrossel: { key: "carrossel", label: "Carrossel",         spec: "4:5 1080x1350, 3-8 cards", hasScript: false },
  reels:     { key: "reels",     label: "Reels",             spec: "9:16 1080x1920, com roteiro", hasScript: true },
  stories:   { key: "stories",   label: "Stories",           spec: "9:16 1080x1920, sequencia", hasScript: true },
  legenda:   { key: "legenda",   label: "Legenda avulsa",    spec: "so texto",             hasScript: false },
};

// ---- Tons (refinamento opcional; a VOZ base ja vem da marca) ----
export const CONTENT_TONES: Array<{ key: string; label: string }> = [
  { key: "padrao",     label: "Padrao da marca" },
  { key: "didatico",   label: "Didatico" },
  { key: "inspirador", label: "Inspirador" },
  { key: "direto",     label: "Direto ao ponto" },
  { key: "proximo",    label: "Proximo e acolhedor" },
];

// ---- Ciclo de vida do conteudo (FONTE UNICA de status) ----
// Os valores SAO os do CHECK do banco (premium_content_posts): draft|planned|in_copy|in_design|review|
// approved|scheduled|published|archived. O board (Conteúdos) e o Calendário consomem este modelo —
// sem mais divergencia PT x EN. `lane` agrupa os status em colunas do board.
export interface ContentStatus { key: string; label: string; lane: string; order: number }

export const CONTENT_STATUSES: ContentStatus[] = [
  { key: "draft",     label: "Rascunho",   lane: "rascunho",   order: 1 },
  { key: "planned",   label: "Planejado",  lane: "rascunho",   order: 1 },
  { key: "in_copy",   label: "Em copy",    lane: "producao",   order: 2 },
  { key: "in_design", label: "Em design",  lane: "producao",   order: 2 },
  { key: "review",    label: "Em revisão", lane: "revisao",    order: 3 },
  { key: "approved",  label: "Aprovado",   lane: "aprovado",   order: 4 },
  { key: "scheduled", label: "Agendado",   lane: "agendado",   order: 5 },
  { key: "published", label: "Publicado",  lane: "publicado",  order: 6 },
  { key: "archived",  label: "Arquivado",  lane: "arquivado",  order: 7 },
];

// Colunas do board Conteúdos (cada uma agrega 1+ status do banco).
export const CONTENT_BOARD_LANES = [
  { key: "rascunho",  label: "Rascunho" },
  { key: "producao",  label: "Em produção" },
  { key: "revisao",   label: "Em revisão" },
  { key: "aprovado",  label: "Aprovado" },
  { key: "agendado",  label: "Agendado" },
  { key: "publicado", label: "Publicado" },
];

// Status que o operador pode escolher manualmente (sem 'planned'/'archived' por padrao).
export const CONTENT_STATUS_OPTIONS = CONTENT_STATUSES
  .filter((s) => !["planned", "archived"].includes(s.key))
  .map((s) => ({ key: s.key, label: s.label }));

export function contentStatusMeta(status: string | null | undefined): ContentStatus {
  return CONTENT_STATUSES.find((s) => s.key === String(status || "")) || CONTENT_STATUSES[0];
}
export function contentStatusLane(status: string | null | undefined): string {
  return contentStatusMeta(status).lane;
}
export function contentStatusLabel(status: string | null | undefined): string {
  return contentStatusMeta(status).label;
}

export const DEFAULT_CONTENT_TYPE = "imovel";

export function contentTypeSpec(key: string | null | undefined): ContentType {
  return CONTENT_TYPES[String(key || "")] || CONTENT_TYPES[DEFAULT_CONTENT_TYPE];
}

export function contentFormatSpec(key: string | null | undefined): ContentFormat {
  return CONTENT_FORMATS[String(key || "")] || CONTENT_FORMATS.feed;
}

// Nivel de vinculo com oferta/imovel do tipo: "required" | "suggested" | "none". Dirige a
// obrigatoriedade CONTEXTUAL do campo "Oferta vinculada" na aba Produção (e o guard no createContentPost).
export function contentTypeOffer(key: string | null | undefined): ContentOfferLink {
  return contentTypeSpec(key).offer || "none";
}

// Opcoes para os seletores da UI.
export const CONTENT_TYPE_OPTIONS = Object.values(CONTENT_TYPES).map((t) => ({
  key: t.key, label: t.label, pillar: t.pillar, format: t.format, funnel: t.funnel, offer: t.offer,
}));
export const CONTENT_PILLAR_OPTIONS = Object.values(CONTENT_PILLARS).map((p) => ({
  key: p.key, label: p.label, funnel: p.funnel,
}));
export const CONTENT_FORMAT_OPTIONS = Object.values(CONTENT_FORMATS).map((f) => ({
  key: f.key, label: f.label, hasScript: f.hasScript,
}));
