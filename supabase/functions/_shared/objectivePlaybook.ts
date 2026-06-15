// Playbook de objetivos Meta Ads — FONTE UNICA (fase 2e). O operador escolhe UM objetivo em linguagem
// simples; todo o resto (optimization_goal, destino, CTA, billing, pre-requisitos, foco do funil para a
// IA) e DERIVADO daqui. Mantem a padronizacao: nenhum caminho ad-hoc por objetivo nas edges/UI.
//
// Puro TS (sem Deno/Vite APIs) — importado tanto pela Edge (Deno) quanto pelo dashboard (Vite), igual
// a copyValidation.ts. Na Meta o objetivo e da CAMPANHA (nao se mistura entre conjuntos); "testar
// objetivos" = campanhas paralelas com os mesmos criativos.
//
// `needs`: pre-requisitos que dependem de config externa (pixel, ToS de Lead, numero WhatsApp). Itens
// com `available:false` ficam visiveis porem bloqueados ate o pre-requisito existir (Vendas->pixel,
// Leads-formulario->ToS). `destination_type:null` = deixa a Meta usar o default do objetivo.

export interface ObjectiveSpec {
  key: string;
  label: string;            // rotulo em pt-BR para o operador
  objective: string;        // OUTCOME_* da Meta
  optimization_goal: string;
  billing_event: string;
  destination_type: string | null;
  cta: string;              // call_to_action_type do criativo
  needs: string[];          // 'pixel' | 'leadgen_tos' | 'whatsapp' | 'page'
  available: boolean;       // construivel ja (sem pre-requisito externo)
  funnel: string;           // dica de etapa do funil para a IA de publico/copy
  hint?: string;            // o que falta, quando !available
}

export const META_OBJECTIVES: Record<string, ObjectiveSpec> = {
  awareness: {
    key: "awareness", label: "Reconhecimento", objective: "OUTCOME_AWARENESS",
    optimization_goal: "REACH", billing_event: "IMPRESSIONS", destination_type: null,
    cta: "LEARN_MORE", needs: [], available: true,
    funnel: "topo de funil: alcance amplo, awareness da marca/empreendimento",
  },
  traffic: {
    key: "traffic", label: "Trafego", objective: "OUTCOME_TRAFFIC",
    optimization_goal: "LANDING_PAGE_VIEWS", billing_event: "IMPRESSIONS", destination_type: "WEBSITE",
    cta: "LEARN_MORE", needs: [], available: true,
    funnel: "meio de funil: levar ao site/landing/WhatsApp, visitas qualificadas",
  },
  engagement: {
    key: "engagement", label: "Engajamento", objective: "OUTCOME_ENGAGEMENT",
    optimization_goal: "POST_ENGAGEMENT", billing_event: "IMPRESSIONS", destination_type: null,
    cta: "LEARN_MORE", needs: [], available: true,
    funnel: "engajamento: interacao com a peca, publico que reage a conteudo",
  },
  leads: {
    key: "leads", label: "Leads (clique)", objective: "OUTCOME_LEADS",
    optimization_goal: "LINK_CLICKS", billing_event: "IMPRESSIONS", destination_type: "WEBSITE",
    cta: "LEARN_MORE", needs: [], available: true,
    funnel: "fundo de funil: intencao de compra, clique para site/WhatsApp",
  },
  leads_form: {
    key: "leads_form", label: "Leads (formulario)", objective: "OUTCOME_LEADS",
    optimization_goal: "LEAD_GENERATION", billing_event: "IMPRESSIONS", destination_type: "ON_AD",
    cta: "SIGN_UP", needs: ["leadgen_tos"], available: false,
    funnel: "fundo de funil: formulario instantaneo na propria Meta",
    hint: "Requer aceitar o ToS de Lead na Pagina (facebook.com/legal/leadgen/tos).",
  },
  sales: {
    key: "sales", label: "Vendas / Conversoes", objective: "OUTCOME_SALES",
    optimization_goal: "OFFSITE_CONVERSIONS", billing_event: "IMPRESSIONS", destination_type: "WEBSITE",
    cta: "SHOP_NOW", needs: ["pixel"], available: false,
    funnel: "conversao: otimiza por evento de conversao no site",
    hint: "Requer um pixel com evento de conversao configurado.",
  },
};

export const DEFAULT_OBJECTIVE = "leads";

export function objectiveSpec(key: string | null | undefined): ObjectiveSpec {
  return META_OBJECTIVES[String(key || "")] || META_OBJECTIVES[DEFAULT_OBJECTIVE];
}

// Opcoes para o seletor da UI (inclui os indisponiveis, com hint).
export const META_OBJECTIVE_OPTIONS = Object.values(META_OBJECTIVES).map((o) => ({
  key: o.key, label: o.label, available: o.available, needs: o.needs, hint: o.hint || "",
}));
