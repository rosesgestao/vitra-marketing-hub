# Atualizacao 2026-06-23 — Template 09 "Vitrine alto padrão" (referência do cliente)

> 9º template aprovado da Imobiliária, fiel ao conceito de uma referência visual fornecida. Na `main`. Commit: **25f9061**.

## Conceito (da referência)
Painel **navy com corte DIAGONAL à esquerda** (foto do prédio atrás) com wordmark + headline (Anton) +
**De/Por** + **checklist de selos-check dourados** + **CTA pill clara**; à direita, **coluna de 3 fotos
arredondadas** sobre fundo off-white. Não copiei textos/logo da referência — só a estrutura/conceito,
adaptada ao brandbook Vitra Imobiliária (navy + dourado, wordmark VITRA branco).

## Implementação
- **Edge** (`render-asset`): `buildVitraVitrineSvg` — polígono navy diagonal (clip) com foto do prédio
  atrás + véu; galeria de 3 fotos (`duoSelosPhoto`); selos-check (`heroChecklistBadge`); De/Por
  (`priceParts`/`formatMoneyLike`); CTA pill off-white com texto navy. **3 formatos** com composição própria
  (1:1, 9:16, 1.91:1) + safe zone. Registrado no dispatch, allowlist e `maxTemplateImages=4` (prédio + 3).
- **Catálogo**: família `vitra-imobiliaria-vitrine-gallery` (9ª da Imob), `fieldGroups` (headline, De/Por,
  checklist 5, cta), `imageSlots` (prédio + 3 galeria), `variationContract` (5 recipes), `renderVersion:
  vitrine-gallery-approved-v1`, 6 previews. Espelho `renderVersions.ts`; guard test (9 imob / 5 selecionáveis).

## Polimento durante a verificação
- Removido o tag pill opcional (colidia com a headline e a referência não tem — os selos-check são os "selos").
- Bullets estavam truncando ("Bourbon Wa…", "ch…") → aumentei o orçamento de texto (size/chars) → 5 itens
  completos.

## Verificação (ao vivo)
deno check + lint + **164 testes** + build; deploy CLI. 3 formatos renderizados (assets temporários, com 4
fotos via slots `source_images`, depois removidos) — 1:1 e 9:16 conferidos contra a referência: painel
diagonal, headline, De/Por, 5 selos-check completos, galeria de 3 fotos, CTA pill clara; safe zone ok. 6
previews em public/generated/vitra-imobiliaria. Marca: Imobiliária (a referência é VITRA navy).

Ver [[Atualizacao_2026-06-12_Template_07_Hero_Panel_San_Clemente]].
