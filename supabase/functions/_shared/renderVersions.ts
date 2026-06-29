// Fonte unica do render-version (cache-busting da ARTE) por family, do lado da Edge. Espelha o
// catalogo do dashboard (creativeTemplateCatalog.js, campo `renderVersion`). O teste de guarda em
// dashboard/src/lib/__tests__/templateCatalog.test.js importa ESTE arquivo e falha se divergir do
// mapa derivado do catalogo — assim ha uma fonte de cada lado (Deno nao importa modulos do Vite) e
// o CI impede dessincronizacao.
//
// So families com bump explicito entram aqui; um bump (mudar a string) forca o re-render dos PNGs
// ja em storage daquela family. As 3 families sem entrada ficam de fora de proposito (nao ha arte
// nova a versionar e nao queremos re-render retroativo em massa de pecas que ja estao corretas).
export const VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION: Record<string, string> = {
  "vitra-imobiliaria-financiamento-orla": "financiamento-orla-approved-v7",
  "vitra-imobiliaria-hero-checklist": "hero-checklist-logo-png-v3",
  "vitra-imobiliaria-duo-selos-offer": "duo-selos-approved-v1",
  "vitra-imobiliaria-hero-panel-gallery": "hero-panel-approved-v1",
  "vitra-imobiliaria-lancamento": "lancamento-approved-v2",
  "vitra-imobiliaria-vitrine-gallery": "vitrine-gallery-approved-v1",
  "vitra-imobiliaria-oportunidade-bairro": "oportunidade-bairro-approved-v1",
  "vitra-imobiliaria-ficha-imovel": "ficha-imovel-approved-v1",
  "vitra-imobiliaria-oferta-ancora": "oferta-ancora-approved-v1",
  "vitra-imobiliaria-destino-bairro": "destino-bairro-approved-v2",
};

export function renderVersionForFamily(family: string | null | undefined): string | null {
  if (!family) return null;
  return VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION[family] ?? null;
}
