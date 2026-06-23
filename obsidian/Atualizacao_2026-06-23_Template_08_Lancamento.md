# Atualizacao 2026-06-23 — Template 08 "Lançamento / Em breve" (Tráfego Pago, Imobiliária)

> 8º template aprovado da Imobiliária, fiel ao último padrão (San Clemente). Na `main`. Commit: **<HASH>**.

## O que é
Peça de **expectativa / topo de funil**: foto hero full-bleed + **selo dourado** (tag: Lançamento/Em breve)
no topo + headline grande (Anton) + linha de **localização** dourada + **CTA pill**. Sem De/Por nem checklist.
Capta lista de interessados antes do lançamento. Imobiliária (navy + dourado), wordmark branco.

## Implementação (mesma arquitetura do último aprovado)
- **Catálogo** (`creativeTemplateCatalog.js`): família `vitra-imobiliaria-lancamento` (8ª da Imob),
  `fieldGroups` (product_name, **tagline=selo**, suggested_headline, location, cta), `imageSlots` (1 hero),
  `variationContract` (5 recipes: Lançamento, Em breve, Pré-lançamento, Localização, Lista VIP),
  `variants` (com/sem moldura), `renderVersion: lancamento-approved-v1`, preview + references (6 PNGs).
- **Edge** (`render-asset`): `buildVitraLancamentoSvg` com **3 branches de formato** (1:1, 9:16, 1.91:1),
  safe zone do Meta por formato (reels-safe no 9:16); registrado no dispatch + no allowlist
  `VITRA_IMOBILIARIA_TEMPLATE_FAMILIES` (faltava — sem isso caía no fallback satori genérico) + maxImages=1.
- **Espelho** `_shared/renderVersions.ts` + guard test atualizado (8 templates, 4 selecionáveis, ≥5 recipes).

## Verificação (ao vivo)
- deno check + lint + **164 testes** (guard catálogo↔Edge) + build OK; deploy CLI.
- 3 formatos renderizados (assets temporários na Murano, depois removidos): 1:1 e 9:16 conferidos por imagem
  — selo "LANÇAMENTO", headline, localização dourada, CTA; **safe zone respeitada** no story. 6 previews
  (sem+com moldura) baixados em `public/generated` e servidos (HTTP 200).
- Bug pego e corrigido no caminho: a family não estava no allowlist do Edge → render genérico ("MURANO" como
  eyebrow); após adicionar, renderiza o design correto.

## Critérios de aceite (todos atendidos)
Aparece no modal com preview; 3 formatos com composição própria + safe zone; campos do brief aplicados (selo,
headline, localização, CTA, foto, marca); identidade preservada; ≥5 variações; renderVersion + guard verde.
Premium fica para uma próxima (só Imobiliária nesta primeira, conforme combinado).

Ver [[Atualizacao_2026-06-12_Template_07_Hero_Panel_San_Clemente]].
