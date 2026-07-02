# Spec — Sistema determinístico de geração de criativos (2026-07-01)

Definição técnica implementável para tornar a geração de criativos **previsível, rastreável e controlada
por regras objetivas** — não pela interpretação das skills nem do modelo. Papel: Dev Sênior + PO +
Diretor de Design. Esta nota é a **fonte da verdade do roadmap**; a autoridade final é o código.

> **Motivo de existir:** o playbook por família (render → diagnóstico → fix → v2 → verde) fechou o gate
> atual, mas **deixou resíduo em cada uma das 6 famílias** porque o gate ainda não cobre tudo (contraste
> real, conformidade de token, fonte mínima, proporção de logo, divergência entre formatos, padding).
> Esta spec define a fundação que **remove a fonte da deriva** para o resíduo não voltar.

## PARTE I — Diagnóstico

### Já implementado (3 camadas)
- **Tokens/geometria** `_shared/creativeDesign.ts`: `DS_COLORS`, `DS_FONT`, `space()` base-8, `DS_RADII`,
  `formatSpec` (safe-zone real por formato), `withinSafe`, `overlapArea`.
- **Layout auto-equilibrante** `_shared/layoutKit.ts`: `fitFillSize`, `fillRatio`, `centerStartX`,
  `distributeV`, `maxVerticalGap`, `measuredWidthPx`.
- **Validador** `_shared/creativeLint.ts` (v2): safe_zone, overlap, overflow (minFont e fill), char_limit,
  contrast_no_scrim, hierarchy, underfill, axis_misaligned, dead_gap, price_weak, logo_missing. Métricas:
  fill_{role}, axis_spread, max_gap, price_ratio.
- **Fit** `_shared/textFit.ts`; **versão** `_shared/renderVersions.ts` (+ teste-guarda);
  **schema de campos** `creativeTemplateCatalog.js`; **gate operacional** no `PremiumDashboard.jsx`
  (bloqueia aprovar/publicar se `lint.ok===false`); **loop** `creative-qa.mjs` + `/qa-creative`;
  **marca** `_shared/copyValidation.ts`.

### Gaps (o que falta)
Escala tipográfica/pesos/line-height/sombras/strokes/paddings/proporção imagem/proporção logo **não são
tokens** (números mágicos nos builders). Componentes de preço/CTA/badge/card **duplicados por template**.
Zonas de posição vivem em **código**, não em dados. Contraste é só **presença de scrim** (não razão WCAG
real). Sem validação de **enquadramento/luminância** da imagem atrás do texto. Nada impede **cor/fonte
fora do token**. Sem checagem de **divergência entre formatos**. Lint sem **3 níveis de severidade**.
Observabilidade sem **skills/regras/iterações/decisão/versões**. Sem **regressão visual (pixel-diff)**.
Matriz de teste rasa (só oferta tem curto/médio/longo; sem vazio/preço/imagem H-V-Q; **sem Premium**).
Render **salva com ok:false** (só o front bloqueia — bloqueio não é real). Governança sem **ciclo de vida**
formal do template nem **versão do DS**.

## PARTE II — Arquitetura recomendada
Fonte única (DADOS, não código): `designTokens.ts` (cor/tipo/peso/lh/spacing/sombra/raio/imagem/logo) +
`templateSchemas.ts` (zonas fixas por formato + campos + fallbacks + prioridade + perfil de lint) +
`components.ts` (priceBlock/ctaPill/badge/card/logo — builders únicos) + `renderVersions.ts`/`ds_version`.
Motor (`render-asset`) **lê zonas do schema** e compõe com components+tokens; monta `LintElement[]` das
mesmas medidas. `creativeLint` v3 (erro/alerta/recomendação) → **bloqueia no render** (não só no front) →
`render_trace` (observabilidade). QA Harness (matriz) + Visual Regression (golden) no CI. `/qa-creative`
conserta na fonte, re-roda, rollback, **relatório persistido**.
**Princípio-chave: a posição de cada elemento é dado (schema), não decisão do motor.**

## PARTE III — Especificação

### 1. Design tokens obrigatórios (`_shared/designTokens.ts`)
`DS_TYPE` (papel → family/weight/min/max/lh/tracking p/ hero, headline, price, subtitle, label, body, cta,
footnote, badge), `DS_WEIGHT` (400/500/600/700/800), `DS_STROKE` (hairline 1.2 / panel 1.4 / frame 2),
`DS_PADDING` (plate 24 / panel 28 / pill 28 / card 22 / badge 15), `DS_SHADOW` (plate/pill sintética —
Resvg tem filter limitado), `DS_IMAGE` (ratio por formato feed .30–.55 / story .35–.60 / wide .40–.70;
minLumaContrast 4.5; grade navy), `DS_LOGO` (widthRatio feed .145 / story .155 / wide .115; aspect
434/2538), `DS_GRID` (12 col / gutter 24), `DS_ICON` (set vitra-line, stroke 2, noEmoji), `DS_VERSION`.
Mantidos: `DS_COLORS`, `DS_FONT`, `space()`, `DS_RADII`, `formatSpec`. **Nenhum builder pode ter literal
de tamanho/peso/spacing/sombra.**

### 2. Regras determinísticas de layout
safe-zone ✅ · eixo (axis_spread ≤ axisTol) ✅ · distribuição (max_gap ≤ gapCap) ✅ · preenchimento
(minFill ≤ fill ≤ maxFill) ✅ · overflow (fontSize ≤ minFont) ✅ · colisão (>6% da menor caixa) ✅ ·
hierarquia (herói = maior display) ✅ · preço (price_ratio ≥ priceMinRatio) ✅ · logo presente ✅ +
**proporção logo** (novo) · **máx. de linhas** (novo) · **fonte ≥ DS_TYPE.min** (novo) · **padding
interno** (ALERTA, novo) · **proporção imagem×conteúdo** (ALERTA, novo) · **contraste WCAG real** (ERRO,
novo) · **enquadramento/luminância** (ERRO, novo) · centralização vs lateral pelo **arquétipo** do schema
· adaptação por formato = zonas próprias obrigatórias. Arquétipos: `left-anchored` (eixo), `centered`
(centro), `photo-forward` (scrim/contraste).

### 3. Schema formal (`_shared/templateSchemas.ts`)
`TemplateSchema { id, family, archetype, required[], optional[], formats{feed|story|wide:{zones[],
imageRatio}}, fields{role:{charLimit, priority, fallback:hide|derive|texto, longText:shrink|wrap|
truncate-block}}, lint(LintOptions+rules[]), approvedVariants[], dsVersion }`. `Zone { role, anchor,
rel(x,y,w,h ∈ [0..1] sobre a safe), z }`. Onde o schema define zona, **o motor não decide** — só faz
fit/wrap dentro dela. Fallbacks são política declarada.

### 4. Validações com severidade (`creativeLint` retorna errors/warnings/recommendations/metrics)
ERRO bloqueante: overflow · fora do canvas/safe · sobreposição · desalinhamento · contraste insuficiente
(WCAG) · fonte < mínimo · headline longa (char_limit) · preço sem destaque (price_weak) · logo
desproporcional · imagem mal enquadrada · área vazia sem intenção (underfill/dead_gap) · quebra de
hierarquia · cor/fonte fora do token (token_conformance) · componente não aprovado (component_registry).
ALERTA: padding/margem · proporção imagem×conteúdo · divergência entre formatos (format_divergence).
RECOMENDAÇÃO: respiro/legibilidade sub-ótima. **Bloqueio** = errors>0 ⇒ ok:false ⇒ render RETORNA erro.
**Aprovação** = errors=0 E métricas dentro do baseline golden.

### 5. Loop — a adicionar
baseline de métricas (golden, além de ok) · regeneração por **componente** (regra→componente→patch) ·
**comparação visual** (pixel-diff) · **relatório persistido** por rodada · golden metrics+PNG contra
regressão · artefato JSON final (CI + vault). Já ok: critério mensurável, --max, parada, rollback.

### 6. Testes
Unit helpers ✅ · unit **componentes** (novo) · layout/overflow/hierarquia ✅ · responsividade (3 formatos)
✅ · **regressão visual (screenshot diff, tol ~1%)** (novo) · curto/médio/longo por família (hoje só
oferta) · **preços de extensões diferentes** por família · **imagens H/V/quadrada** · **Premium no
harness** · formatos ✅ · **campos vazios/ausentes** (fixture mínimo).

### 7. Observabilidade (`_shared/renderTrace.ts` → `metadata.render_trace`)
ds_version, template_version, archetype, format, rules_applied[], lint{ok,errors,warnings,recommendations,
metrics}, image{orientation,luma_behind_text}, iterations, decided(approved|blocked), reason, skills[],
tests{harness,visual_regression}, rendered_at.

### 8. Governança
Ciclo de vida: draft → harness verde com **N≥6 fixtures** (curto/médio/longo/vazio/preço/imagem) →
**aprovação visual registrada** → selectable; senão hidden. Alteração exige bump de renderVersion +
harness verde + diff visual no PR. `DS_VERSION` com changelog (bump ⇒ re-render+re-harness das afetadas).
Brandbook com cadência de revisão; token_conformance garante que o código não desvie. Desativação via
hidden (assets antigos resolvem por id). Aprovação **técnica** = CI verde; **visual** = registro humano no PR.

## PARTE IV — Plano

### Criar
`_shared/designTokens.ts` · `_shared/components.ts` · `_shared/templateSchemas.ts` · `_shared/contrast.ts`
· `_shared/renderTrace.ts` · `dashboard/scripts/creative-visual-regression.mjs` + `scripts/golden/` ·
`.github/workflows/creative-qa.yml`.

### Alterar
`creativeLint.ts` (3 níveis + contrast_ratio/image_framing/min_font/logo_ratio/max_lines/token_conformance/
format_divergence/component_registry) · `render-asset/index.ts` (builders leem zonas + usam components+
tokens; grava render_trace; ok:false ⇒ retorna erro) · `creative-qa.mjs` (matriz completa + Premium +
baseline golden) · `creativeTemplateCatalog.js` (liga schema + ds_version) · testes.

### Ordem (fundação primeiro; NÃO repetir o playbook por família — a fundação é que impede o resíduo)
1. **Tokens** (`designTokens.ts`) + refatorar oferta-ancora p/ consumir e re-harness.
2. **Componentes** (`components.ts`) — extrair price/cta/badge/logo/card; migrar família a família.
3. **Schemas formais** — zonas por formato; builders leem zonas.
4. **Lint v3** — contraste real + conformidade de token + divergência + severidade.
5. **Bloqueio real + render_trace**.
6. **Harness expandido** (matriz + Premium + baseline).
7. **Visual regression** (golden) + **CI**.
8. **Governança** (ciclo de vida + DS versionado + checklist de PR).

### Riscos e dependências
`estimateTextWidthPx` é estimativa (Anton subestima) ⇒ WIDTH_SAFETY + pixel-diff golden como rede.
Resvg com filter limitado ⇒ sombra sintética. Refatorar builders p/ schema-driven é alto risco ⇒ uma
família por vez sob harness. Visual regression exige render estável (fonte/isolate) ⇒ tolerância + retry.
Service key p/ harness/CI ⇒ secret no GitHub. Premium no harness ⇒ fixtures + separação de marca.
Contraste sobre foto ⇒ amostrar luminância no render (custo só atrás de texto crítico).

### Checklist final (concluído quando)
- [ ] designTokens.ts é a única fonte de tipo/peso/lh/spacing/sombra/stroke/padding; zero literal nos builders.
- [ ] Selecionáveis (+ Premium) usam components.ts (price/cta/badge/card/logo únicos).
- [ ] Cada selecionável tem schema formal; o builder lê zonas.
- [ ] creativeLint com erro/alerta/recomendação; contraste real, imagem, token_conformance, format_divergence, component_registry ativos.
- [ ] Gate bloqueia de fato (render retorna erro em ok:false).
- [ ] render_trace gravado em todo asset.
- [ ] Harness cobre curto/médio/longo/vazio + preço + imagem H/V/Q × 3 formatos × 2 marcas; baseline versionado.
- [ ] Visual regression golden verde; CI trava merge no vermelho.
- [ ] Governança: selectable só após N fixtures verdes + aprovação visual; DS versionado com changelog.

## Progresso
- **Etapa 1 ✅:** [[Atualizacao_2026-07-01_Etapa1_Design_Tokens]] — designTokens.ts + oferta-ancora
  token-driven (logo por ratio canônico; GOLD/OFF_WHITE = DS_COLORS; harness 12/12; 208 testes).
- **Etapa 2 ✅ COMPLETA:** `components.ts` + `logoBlock`. Passo 1
  [[Atualizacao_2026-07-01_Etapa2_Componentes_Logo]] oferta+destino; passo 2
  [[Atualizacao_2026-07-01_Etapa2_Logo_4Familias]] 4 SVG → **logo unificada nas 6** (pegou o bug
  hero-checklist feed na inspeção → regra de gap logo↔headline vai p/ Etapa 4); passo 3
  [[Atualizacao_2026-07-01_Etapa2_Tokenizar_Preco_CTA_Badge]] preço/CTA/badge **tokenizados** (decisão:
  tokenizar, não homogeneizar; byte-diff IDÊNTICO). Pendências mapeadas p/ Etapa 3/4: preço/CTA inline
  dos builders, fonte Poppins, valores non-token.
- **Etapa 3 (em andamento — 3/6):** `templateSchemas.ts` + schema-driven em **oferta**
  [[Atualizacao_2026-07-01_Etapa3_Schemas_Oferta]], **destino + ficha**
  [[Atualizacao_2026-07-01_Etapa3_Schemas_Destino_Ficha]] (padrão: mover o L verbatim p/ `xLayout()`,
  byte-idêntico). Faltam **vitrine, hero-checklist, duo-selos** (+ tokenizar preço/CTA inline junto);
  depois guard catálogo↔schema.
- **Etapa 4 (depois):** lint v3 — contraste WCAG real, token_conformance, format_divergence, gap mínimo
  logo↔headline (achado do passo 2), 3 níveis de severidade.

[[render-asset-deploy-e-limites]] · [[validacao-criativo-arquitetura]]
