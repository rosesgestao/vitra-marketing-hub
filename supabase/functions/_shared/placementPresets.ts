// Presets de POSICIONAMENTOS MANUAIS (plataformas + positions) — destilados das campanhas de referência
// (TOM 30.05/10.06). Achado: todos os conjuntos usaram FB + IG (Messenger e Audience Network DESATIVADOS),
// cobrindo feed/stories/reels/marketplace/perfil — sem coluna da direita, in-stream, pesquisa nem instant
// article. Puro TS (Deno + Vite). Os arrays seguem os enums de posicionamento da Meta.

export interface PlacementPreset {
  key: string;
  label: string;
  origin: string;
  advantage_plus: boolean;              // true = deixa a Meta otimizar TODOS os locais (omite posições)
  publisher_platforms: string[] | null; // null = automático (Advantage+)
  facebook_positions?: string[];
  instagram_positions?: string[];
  messenger_positions?: string[];
  audience_network_positions?: string[];
  // Formatos de criativo que estes posicionamentos exigem (compatibilidade com a arte gerada).
  needs_formats: ("feed" | "story")[];
}

export const PLACEMENT_PRESETS: PlacementPreset[] = [
  {
    key: "fb_ig_recomendado",
    label: "Facebook + Instagram (recomendado)",
    origin: "TOM 30.05 / 10.06 — sem Messenger/Audience Network",
    advantage_plus: false,
    publisher_platforms: ["facebook", "instagram"],
    // União dos posicionamentos vistos nas 3 referências (macro 30.05 é a mais completa no IG).
    facebook_positions: ["feed", "marketplace", "story", "facebook_reels", "profile_feed"],
    instagram_positions: ["stream", "story", "explore", "reels", "profile_feed"],
    needs_formats: ["feed", "story"],
  },
  {
    key: "feed_stories_min",
    label: "Só Feed + Stories/Reels (enxuto)",
    origin: "Subconjunto da referência — encaixe perfeito nos 2 formatos",
    advantage_plus: false,
    publisher_platforms: ["facebook", "instagram"],
    facebook_positions: ["feed", "story", "facebook_reels"],
    instagram_positions: ["stream", "story", "reels"],
    needs_formats: ["feed", "story"],
  },
  {
    key: "automatico",
    label: "Automático (Advantage+ posicionamentos)",
    origin: "Padrão da Meta — inclui Messenger e Audience Network",
    advantage_plus: true,
    publisher_platforms: null,
    needs_formats: ["feed", "story"],
  },
];

export function placementPreset(key: string): PlacementPreset | null {
  return PLACEMENT_PRESETS.find((p) => p.key === key) || null;
}

// Posicionamentos que NÃO são cobertos pelos formatos Feed 4:5 + Story/Reels 9:16 (exigiriam outra arte).
// Servem para avisar incompatibilidade na UI se o operador adicionar manualmente.
export const PLACEMENTS_NEEDING_OTHER_FORMATS: Record<string, string> = {
  right_hand_column: "Coluna da direita (FB) — usa imagem pequena/1.91:1",
  instream_video: "Vídeos in-stream — exige vídeo",
  ig_search: "Pesquisa no Instagram — formato próprio",
  search: "Resultados de pesquisa (FB) — formato próprio",
  instant_article: "Instant Articles — formato próprio",
};
