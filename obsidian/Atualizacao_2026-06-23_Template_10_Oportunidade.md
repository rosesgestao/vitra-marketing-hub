# Atualizacao 2026-06-23 — Template 10 "Oportunidade no bairro" (referência do cliente)

> 10º template aprovado da Imobiliária, fiel ao conceito de uma referência visual fornecida. Na `main`. Commit: **6f88e67**.

## Conceito (da referência)
**Foto aérea/hero full-bleed** + **coluna de blocos navy à esquerda** (eyebrow "OPORTUNIDADE" + headline do
bairro em Anton + caixa de preço + barra de subtítulo/tipologia + painel de checklist com selos) e, à
direita, **galeria de 3 fotos em moldura navy** + wordmark VITRA em caixa navy no topo. Não copiei
textos/logo — só a estrutura/conceito, adaptada ao brandbook Vitra Imobiliária.

## Adaptação de marca (decisão de design)
A referência usa **checks verdes** (cor fora da paleta Vitra). Adaptei para **selos-check dourados** (paleta
oficial), mantendo consistência com os demais templates aprovados. Documentado em `fixedBrandRules`.

## Implementação
- **Edge** (`render-asset`): `buildVitraOportunidadeSvg` — hero full-bleed + véu; blocos navy (gradiente
  `#13294C→#0A1628`) para eyebrow/headline/preço/subtítulo/checklist; galeria de 3 fotos (`duoSelosPhoto`)
  com **moldura navy em offset** (efeito de profundidade) + wordmark em caixa navy. **3 formatos** com
  composição própria (1:1, 9:16, 1.91:1) + safe zone. Dispatch + allowlist + `maxTemplateImages=4`.
- **Catálogo**: família `vitra-imobiliaria-oportunidade-bairro` (10ª da Imob), `fieldGroups` (eyebrow,
  headline-bairro, preço, subtítulo, checklist 6), `imageSlots` (hero + 3 galeria), `variationContract`
  (5 recipes), `renderVersion: oportunidade-bairro-approved-v1`, 6 previews. Espelho `renderVersions.ts`;
  guard test (10 imob / 6 selecionáveis).

## Verificação (ao vivo)
deno check + lint + **164 testes** + build; deploy CLI. 3 formatos renderizados (assets temporários com 4
fotos via slots `source_images`, depois removidos) — 1:1 e 9:16 conferidos contra a referência: foto hero,
eyebrow, "MENINO DEUS" (Anton 2 linhas), caixa "R$ 539 MIL", barra "2 DORM. C/ SUÍTE E SACADA", 6
selos-check, galeria emoldurada, wordmark em caixa navy; safe zone ok. 6 previews em
public/generated/vitra-imobiliaria. Marca: Imobiliária (a referência é VITRA navy).

Ver [[Atualizacao_2026-06-23_Template_09_Vitrine]].
