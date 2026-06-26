# Atualização 2026-06-26 — Template 12: Oferta com preço-âncora

Novo template do fluxo de geração de criativos (Tráfego Pago) a partir de uma referência visual do
cliente (peça "2 DORM Av. Ipiranga"): **oferta de preço com a oferta De/Por como protagonista**. Conceito
distinto dos templates atuais — sem checklist vertical, sem CTA-botão, sem galeria.

## Conceito (fiel à referência)
Foto única do imóvel + véu navy; **logo VITRA oficial (PNG branco) centralizada no topo**; headline forte
(Anton); **barra branca de características** (diferenciais juntados por " | "); **"De" riscado** + **"Por"
num BOX de borda dourada** (herói da peça); **rodapé de localização/proximidade**. Paleta navy #0A1628 +
dourado #C4942A; Anton (headline/valor) + Inter (barra/rodapé).

## Implementação
- **Edge `render-asset/index.ts`**: `buildVitraOfertaAncoraSvg` + helper `ofertaBox` (box dourado com fill
  navy translúcido p/ o valor branco saltar). Cada formato tem **composição própria** (objeto `L` por
  formato) com a SAFE ZONE do Meta: 1:1 [margem 90]; 9:16 reels-safe y[250..1470]; 1.91:1 (1200×628)
  compacto. Dispatch + allowlist (`VITRA_IMOBILIARIA_TEMPLATE_FAMILIES`) + `MODEL_LABEL` (3 formatos) +
  `maxTemplateImages`=1 (foto de fundo única).
- **`_shared/renderVersions.ts`** + **catálogo**: `oferta-ancora-approved-v1`.
- **`creativeTemplateCatalog.js`**: family `vitra-imobiliaria-oferta-ancora` (12º template, 8º selecionável)
  — `ofertaAncoraFieldGroups` (product_name, headline, differentials→barra, price_from, price, location) +
  `templateVariationContracts.ofertaAncora` (6 recipes) + entrada com preview/imageSlots.
- **Dados dinâmicos**: headline, características (barra), valor De/Por, localização (rodapé), foto, nome.
- **Thumbnail**: `dashboard/public/generated/vitra-imobiliaria/template-12-oferta-ancora-1x1-sem-moldura.png`
  (o próprio render 1:1).
- **Teste de guarda** atualizado: 12 templates / 8 selecionáveis.

## Verificação (render real, 3 formatos)
deno check + lint + **164 testes** + build OK; deploy do `render-asset` via CLI. Criei 3 assets de teste
(feed/story/wide) na campanha TOM MENINO DEUS com a foto da fachada + o conteúdo da referência, renderizei
os 3 e validei contra o original: **fidelidade alta** — logo VITRA centralizada, headline 2 linhas, barra
branca, De riscado, POR no box dourado, rodapé; cada formato com composição própria dentro da safe zone.
Assets de teste **removidos** depois (DB limpo). Console/render sem erro.

Commit: Edge (build + wiring) + renderVersions + catálogo + teste + thumbnail.
