# Validador de Layout determinístico — Fase 1 (2026-07-01)

Resposta à causa ESTRUTURAL de por que erros básicos de design (vazio lateral, faixa morta, preço fraco)
se repetiam mesmo com as skills instaladas. Investigação + fundação determinística, sobre o
[[Atualizacao_2026-06-30_Trafego_Fase2_Criativo_Oferta_Ancora|oferta-ancora]] como referência.

## Diagnóstico da causa-raiz (investigação no código)
- **As skills de design NÃO rodam na geração.** `ui-ux-pro-max`/`direcao-de-arte`/`frontend-design` são
  documentos que orientam o AUTOR (eu) ao editar o template — não são executados pelo motor. As regras
  eram **recomendações textuais**, não restrições.
- **O motor** (`render-asset`) usa **coordenadas fixas** por formato (números mágicos); sem grid, o
  equilíbrio dependia do olho do autor — que falha e reintroduz erros a cada template/ajuste.
- **O `creativeLint` (6 regras) não bloqueava e não media composição.** Ele valida CAIXAS declaradas
  pelo builder (não pixels), só fazia `console.warn` e **salvava mesmo com `ok:false`**. E não tinha
  regra para preenchimento/vazio/proporção do preço/logo → os erros marcados eram **invisíveis** (davam
  `ok:true`). O `ok` só era exigido no gate de aprovar/publicar Meta — não para exibir.
- **Prova:** as correções anteriores foram para o template (certo), mas sem uma trava que impeça a CLASSE
  do erro — tanto que o próprio fix do story (v3) criou a faixa morta que o usuário marcou.

## Entregue (Fase 1 — "reprovar visível" + referência primeiro)
- **`_shared/layoutKit.ts`** (puro): helpers auto-equilibrantes — `fitFillSize` (texto CRESCE até
  preencher, não só encolhe), `fillRatio`, `centerStartX`, `distributeV` (reparte blocos sem faixa
  morta), `maxVerticalGap`.
- **`_shared/creativeLint.ts` v2** (retrocompatível): 4 regras objetivas novas que BLOQUEIAM —
  **`underfill`** (container com vazio lateral; `fill`<`minFill`), **`dead_gap`** (faixa morta vertical;
  `opts.gapCap`), **`price_weak`** (preço < `priceMinRatio`× o secundário) e **`logo_missing`**
  (`requireLogo`). Grava `metadata.lint.metrics` (fill/gap/price_ratio) → **auditável/rastreável**.
- **`oferta-ancora` refatorado** (causa na fonte, não na mão): `ofertaBox` vira **placa que ABRAÇA o
  conteúdo** e o valor **cresce até preencher** (mata o ouro vazio à direita); **barra abraça** o texto
  (mata o vazio lateral no 1.91:1); **DE + selo economia left-anchored**; **story distribuído** (mata a
  faixa morta). Tolerâncias (`gapCap`) por formato. render-version **v3→v4**.
- **Skill `direcao-de-arte`** atualizada: o pré-flight agora cita as travas v2 + o `layoutKit` (regra de
  ouro: nunca container fixo com conteúdo curto). *(skill gitignored — não versionada.)*

## Verificação (render real, os erros marcados)
- deno check + deploy CLI + 3 cortes reais. Métricas do lint: **`fill_bar=1`, `fill_price=1`** (vazios
  eliminados), **`price_ratio≈3.2`** (preço forte), `max_gap` dentro do teto (feed 178 / story 150 /
  wide 78). **198 testes** (16 novos: layoutKit + lint v2) + ESLint limpos.
- **O gate funcionou de verdade:** na 1ª rodada o validador REPROVOU story+wide com **`safe_zone:logo`**
  — a logo do oferta-ancora estava ACIMA da safe-zone (bug pré-existente, inconsistente com os outros
  templates que usam y=270). Corrigi a posição → `ok:true` nos 3. Foi o validador pegando um erro real
  que "vazava no olho".
- 5 previews do catálogo regenerados (3 sem-moldura + feed/wide com-moldura). **Story com-moldura não
  regenerou: 546 (OOM 9:16) — é o P0.2 conhecido** (precisa do render-worker); mantido o anterior. Assets
  de teste removidos.

## Arquitetura-alvo (7 etapas) e o que falta
Gera → aplica direção de arte (layoutKit) → **valida (determinístico)** → compara c/ referência → corrige/
regenera → re-valida → libera. **Fase 1 entregou 1–3 + reprovação visível** (o gate `metadata.lint.ok`
já bloqueia aprovar/publicar em `PremiumDashboard.jsx`). Próximas fases:
- **Fase 2 — auto-correção:** loop bounded de regeneração no motor + `needs_human` (nunca exibir como OK).
- **Fase 3 — golden reference:** regressão visual por família na CI/pré-flight.
- **Fase 4 — propagar** os helpers auto-equilibrantes aos 9 templates (cada um vira teste).

Commit: layoutKit + creativeLint v2 (validador determinístico) + oferta-ancora auto-equilibrante (v4).
[[render-asset-deploy-e-limites]]
