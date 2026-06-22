// Presets de DIRECIONAMENTO DETALHADO (interesses) — destilados das campanhas de referência da Vitra
// (TOM MENINO DEUS 30.05 e 10.06, conta PoA 122035585232240). Os interesses da Meta são GLOBAIS (id estável,
// não por conta), então estes IDs são reutilizáveis em qualquer campanha. Puro TS (Deno + Vite).
//
// Achado da análise: os conjuntos vencedores NÃO usaram públicos personalizados — usaram SÓ interesses
// (Direcionamento detalhado) + Advantage Audience LIGADO (=1) + idade 25–65. Os 3 presets abaixo espelham
// exatamente as 3 configurações encontradas.

export interface InterestItem { id: string; name: string; tier?: "core" | "recommended" | "optional"; }
export interface DetailedTargetingPreset {
  key: string;
  label: string;
  origin: string;            // de qual conjunto da referência veio
  advantage_audience: 0 | 1; // expansão Advantage (referência usou 1)
  interests: InterestItem[];
}

// Núcleo comum às 3 referências (sempre presente): intenção de compra de imóvel + investimento.
const CORE: InterestItem[] = [
  { id: "6002986908368", name: "Casa (imóveis)", tier: "core" },
  { id: "6003388314512", name: "Investimento (negócios e finanças)", tier: "core" },
  { id: "6788101567252", name: "Portais da web e anúncios de imóveis (sites)", tier: "recommended" },
];

export const DETAILED_TARGETING_PRESETS: DetailedTargetingPreset[] = [
  {
    key: "imovel_intencao",
    label: "Intenção imobiliária (núcleo)",
    origin: "TOM 10.06 + conjunto cidade da 30.05",
    advantage_audience: 1,
    interests: [
      ...CORE,
      { id: "6003103732434", name: "Apartamento (imóveis)", tier: "recommended" },
      { id: "6003435139283", name: "Condomínio (imóveis)", tier: "recommended" },
      { id: "6003693537583", name: "Propriedade de imóveis (imóveis)", tier: "recommended" },
    ],
  },
  {
    key: "alto_padrao",
    label: "Alto padrão / investidor",
    origin: "TOM 30.05 — conjunto regional (raio)",
    advantage_audience: 1,
    interests: [
      ...CORE,
      { id: "6003446239080", name: "Investimento imobiliário (investimento)", tier: "recommended" },
      { id: "6003587074473", name: "Investidor (investimento)", tier: "optional" },
      { id: "6003352779232", name: "Classe executiva", tier: "optional" },
      { id: "6007828099136", name: "Bens de luxo (varejo)", tier: "optional" },
      { id: "6004048615096", name: "Veículo de luxo (veículos)", tier: "optional" },
      { id: "6003383552337", name: "Resorts de luxo (hospedagem)", tier: "optional" },
    ],
  },
  {
    key: "casa_reforma",
    label: "Casa & reforma (morar)",
    origin: "TOM 30.05 — conjunto cidade (macro)",
    advantage_audience: 1,
    interests: [
      ...CORE,
      { id: "6003234413249", name: "Reforma residencial (casa e jardim)", tier: "recommended" },
      { id: "6003418314031", name: "Lar (casa e jardim)", tier: "recommended" },
      { id: "6003693537583", name: "Propriedade de imóveis (imóveis)", tier: "optional" },
    ],
  },
];

export function detailedTargetingPreset(key: string): DetailedTargetingPreset | null {
  return DETAILED_TARGETING_PRESETS.find((p) => p.key === key) || null;
}
