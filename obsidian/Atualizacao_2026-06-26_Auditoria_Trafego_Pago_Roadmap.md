# Auditoria + Roadmap — Seção "Tráfego Pago" (2026-06-26)

Diagnóstico (sem alterar código) como Dev Sênior + PO + Diretor de Design, usando a skill `ui-ux-pro-max`
como lente de UX/fluxo/form/estados/validação. **Identidade e direção de arte permanecem no brandbook +
skill `direcao-de-arte` + Creative Lint** (autoridade de marca). Ancorado em mapeamento real (2 agentes:
fluxo de UI do Tráfego em `PremiumDashboard.jsx` + pipeline `render-asset`/Meta).

## Diagnóstico atual
O Tráfego Pago é **funcionalmente completo e bem cercado** (separação de marca, gate de QA com 8 checagens,
Creative Lint objetivo, Meta sempre PAUSED + confirm, presets, objetivos, públicos). Mas a experiência é de
**ferramenta de poder, não de fluxo guiado**: a jornada campanha→criativos→Meta tem **~40 passos em 5 fases**
sem indicador de progresso, o modal de criação concentra 5 seções densas, e a **qualidade/confiabilidade da
GERAÇÃO** tem defeitos reais de motor. A inteligência proativa existe (skill `direcao-de-arte`, suggest-template,
vitra-copy) mas **não está costurada ao fluxo** — o operador escolhe template no olho e a copy nasce sem
garantia de caber no slot. Não há **comparação automática com referência** (a causa do "criativo genérico"
que já corrigimos no destino-bairro à mão).

## Principais problemas do FLUXO
- **40 passos, sem stepper/progresso** (Forms&Feedback §8: multi-step-progress). Imprevisível; difícil em
  mobile (modal com variações+catálogo+import IA+campos+copy IA+upload numa só rolagem).
- **Editar texto NÃO re-renderiza** (`AdEditModal`→`saveAd` só muda metadata; o preview fica velho até o
  operador clicar "Gerar cortes" de novo — não-óbvio). Iterações desperdiçadas.
- **Falhas silenciosas:** `saveCampaignGeo` faz `.catch(()=>{})`; "Renderização concluída: N com erro" não
  diz QUAL corte/por quê; o bloqueio de lint não linka o corte que reprovou; extract dá erro genérico.
- **Gate inconsistente:** "Exportar pacote" só exige `ads.length>0` (não os 8 checks), enquanto build/aprovar
  exigem QA — dá para exportar/sair com criativo não-validado.
- **Cliques redundantes:** criar campanha + selecionar (sem auto-seleção); build→ativar em 2 passos;
  aprovar-todos pede confirm por grupo.
- **Preview por abas** (1:1 / 9:16 / 1.91:1) em vez de ver os 3 juntos; sem overlay de safe-zone; QA em
  texto 10px (ilegível).
- **Responsividade parcial:** painel de Posicionamentos da Meta é desktop-only; MetaAdCard apertado no mobile.

## Principais problemas dos CRIATIVOS gerados
- **Premium sai sub-1080px** (caminho Satori, `SCALE=0.55` → ~594px) — **abaixo do mínimo da Meta** → anúncio
  borrado/recusado. (Imobiliária usa SVG direto em full-res — ok.)
- **9:16 full-res estoura (546/WORKER_RESOURCE_LIMIT) em isolate frio** → renders intermitentes "com erro".
- **Sem comparação com referência aprovada / regressão visual** — fidelidade ao template deriva sem ninguém
  ver (só o Creative Lint, que valida layout objetivo, não "parece a referência").
- **Copy sem garantia de caber no slot** — `generate-copy` devolve ângulos com `issues[]` mas **não conserta**;
  se exceder o `maxLength`, trunca na arte (vimos no oportunidade/destino). O lint pega depois, mas é retrabalho.
- **Cores hardcoded no `render-asset`** (`GOLD`/`GOLD_LIGHT`/`OFF_WHITE`) em vez de centralizadas em
  `DS_COLORS` → risco de divergência do brandbook.
- **Motor de posicionamento:** `fitDisplaySize` subestima a largura real do Anton (corrigido à mão no
  destino) — a caixa estimada do lint diverge do glifo real → falso-OK / texto largo.

## Causas técnicas e de design
- **Técnicas:** limite de compute do isolate (OOM no 9:16/Satori), Satori low-res no Premium, fila de render
  **serial** (batch 3, ~36/h, sem paralelismo), modelo de fit por estimativa (não medido), tokens duplicados.
- **Design:** fluxo modelado como "painéis de poder" (tudo exposto) em vez de **jornada por etapas**;
  primitivos de feedback/erro ad-hoc; a camada proativa (direcao-de-arte) existe mas não dirige a criação.

---

## Recomendações — classificadas (P0/P1/P2)
Cada item: problema real → ação → front/back → critério de aceite.

### P0 — críticos (funcionamento/geração/qualidade)
- **P0.1 Premium ≥1080px.** Roteia Premium para o caminho **SVG-direto full-res** (como a Imobiliária) ou
  sobe a escala dentro do orçamento / usa o render-worker. Back: `render-asset`. **Aceite:** PNG Premium
  ≥1080 no lado menor nos 3 formatos; Meta aceita; lint ok.
- **P0.2 9:16 determinístico.** SVG-direto + `TALL_RASTER` + **retry no 546** (padrão já conhecido) ou
  9:16 no worker. Back: `render-asset`/worker. **Aceite:** 9:16 renderiza sem 546 em N tentativas; falha
  aparece clara.
- **P0.3 Acabar com falhas silenciosas.** Trocar `.catch(()=>{})` e erros genéricos por `ErrorAlert`/`Toast`
  (Vitra UI, já existem) nomeando corte/campo/URL + caminho de recuperação. Front. **Aceite:** toda falha
  mostra causa + ação; zero catch silencioso; "com erro" diz qual corte e por quê.
- **P0.4 Feedback de operações longas.** Render e build com **progresso por item** (skeleton + status por
  asset; barra/etapa no build). Front (usa LoadingState). **Aceite:** cada op assíncrona mostra progresso +
  conclusão; sem spinner morto.
- **P0.5 Gate único e consistente.** Exportar/Build/Aprovar usam a **mesma** prontidão (`evaluateMetaAdReadiness`).
  Front. **Aceite:** exportar/build desabilitados até os critérios; uma fonte de verdade de QA.

### P1 — produtividade, consistência visual, conversão
- **P1.1 Fluxo guiado (stepper).** Reorganizar em **4 etapas**: Imóvel → Criativos → QA → Meta, com indicador
  de progresso, voltar/avançar e estado preservado. Auto-selecionar a campanha criada; **mesclar build+ativar**
  numa confirmação. Front. **Aceite:** jornada com etapas claras; ≤ ~half dos cliques atuais; back do browser ok.
- **P1.2 Editar → re-render automático.** Após salvar texto, **re-enfileira o render** (ou estado claro
  "precisa re-gerar" + 1 clique). Front (+ trigger de render). **Aceite:** editar texto atualiza o preview
  (auto ou 1 clique) com estado explícito.
- **P1.3 Costurar as skills ao fluxo (direção de arte automática).** Na etapa Imóvel: a partir dos fatos,
  o sistema **sugere o template** (suggest-template) + **gera copy já ajustada ao slot** (`direcao-de-arte`
  + `vitra-copy`, fit por `maxLength`) + seta knobs de arte → assets nascem **lint-aware por construção**.
  Front + edges. **Aceite:** dos fatos sai template + copy que cabe + arte; ≥X% dos cortes passam no lint no
  1º render (hoje há retrabalho por char_limit/overflow).
- **P1.4 Comparação com referência + regressão visual.** Golden-PNG por família em CI (diff) + no app um
  "comparar com a referência aprovada" lado a lado. Back/CI + front. **Aceite:** cada família tem golden;
  CI quebra se a arte derivar; o operador vê referência × gerado.
- **P1.5 QA legível + acionável.** Redesenhar o card de QA (legível, por corte; clicar no erro de lint
  **abre o corte** para corrigir). Front. **Aceite:** cada check reprovado nomeia o corte + oferece a ação.
- **P1.6 Padronizar componentes (Vitra UI).** Adotar `Modal`/`FormField`/`Toast`/`Loading`/`Error`/`Drawer`
  no `NewCampaignModal`, `AdEditModal`, `PublishMetaPanel`, `MetaAdCard` (hoje bespoke; ~150 inputs sem
  label associado). Front. **Aceite:** os 4 surfaces usam os primitivos; a11y de form ok.
- **P1.7 Centralizar tokens de marca.** `render-asset` importa **todos** os hex de `DS_COLORS` (sem
  duplicar). Back. **Aceite:** zero hex de marca hardcoded; uma fonte; guarda em teste.
- **P1.8 Copy cross-marca bloqueante.** Vocabulário Premium na Imobiliária (e vice-versa) **bloqueia** a
  publicação (não só `issues[]`). Back (build_draft) + front. **Aceite:** vocabulário cruzado não publica;
  erro acionável.
- **P1.9 Responsividade do Tráfego.** Painel de Posicionamentos e MetaAdCard responsivos (corretor usa
  tablet). Front. **Aceite:** 768px sem scroll horizontal indevido; legível 375/768/1024/1440.

### P2 — refinamentos de experiência e design
- **P2.1** Preview dos 3 formatos juntos (carrossel/grade) + **overlay de safe-zone** + zoom.
- **P2.2** Progressive disclosure no modal (recolher "Importar IA"/avançado); reduzir densidade.
- **P2.3** Números tabulares (orçamento/alcance), formatação locale, tooltips nos checks de QA.
- **P2.4** Tornar explícita a escolha destino (landing × WhatsApp) — hoje escolhe sozinho.
- **P2.5** Ajuste manual dentro das restrições (re-enquadrar foco da imagem, reordenar fotos) sem quebrar o
  lint (o modelo de slots travados já permite — expor na UI).

---

## Proposta de NOVO FLUXO (4 etapas guiadas)
1. **Imóvel** — marca + fatos (manual OU importar por link/colar → IA extrai). O sistema **sugere template +
   gera copy que cabe + define arte** (P1.3). Upload das fotos aqui.
2. **Criativos** — auto-seed + auto-render; vê os **3 formatos juntos** por variação; lint por corte inline;
   "comparar com referência"; editar (auto re-render); regenerar variação.
3. **QA & Aprovação** — os 8 checks + (futuro) score de legibilidade; aprovar-todos num gate; erros nomeados +
   pular-para-corrigir.
4. **Meta** — objetivo → conta/página (auto) → orçamento/destino → segmentação (presets) → build PAUSED →
   **ativar (1 confirm)**. Checklist de prontidão consolidado.
Indicador de etapa persistente (Imóvel → Criativos → QA → Meta).

## Módulos/componentes a alterar
Front: `NewCampaignModal`, `AdEditModal`, `PublishMetaPanel`, `MetaAdCard`, `PaidTrafficCampaignSelector`,
`AutomationWorkflowPanel`, `TrafegoPagoSection` (todos dentro de `PremiumDashboard.jsx` — relacionado ao
desmonte do monolito) + novo `Stepper` + primitivos Vitra UI. Back: `render-asset/index.ts`,
`_shared/creativeDesign.ts`/`renderVersions.ts`, `generate-copy`, `suggest-template`, `publish-meta-ads`,
catálogo `creativeTemplateCatalog.js`. Skills: `direcao-de-arte`, `vitra-copy`, `vitra-trafego`.

## Mudanças no FRONT-END
Stepper + reflow em 4 etapas; adotar primitivos (Modal/FormField/Toast/Loading/Error); auto-seleção da
campanha; build+ativar unidos; editar→auto re-render; preview multi-formato + safe-zone overlay; QA legível
com pular-para-corrigir; responsividade; UI de comparação com referência; costura das skills (sugestão de
template + copy fit + arte) na etapa Imóvel.

## Mudanças no BACK-END
`render-asset`: Premium full-res (P0.1), 9:16 sem OOM (P0.2), tokens via `DS_COLORS` (P1.7), validação
**pré-render** (não gastar compute em corte fadado), **batch/paralelismo** na fila (escala), alinhar a
estimativa de largura (lint/fit) ao glifo real (motor de posicionamento), endpoint **compare-to-reference**
+ score de legibilidade por formato. `generate-copy`: bloqueio cross-marca (P1.8) + fit ao slot.
Golden-reference store + regressão visual no CI. Fila: subir batch/paralelo ou worker para 9:16.

## Integrações a revisar
Meta (`publish-meta-ads`: consistência do gate build/activate, brand-account guard, objectivePlaybook,
públicos/pixel/leadgen ToS — tudo PAUSED+confirm intacto); **render-worker** (ativar p/ 9:16 Premium full-res);
Anthropic (`generate-copy`/extract — timeouts e erros visíveis); geocode (`saveCampaignGeo` — fim do catch
silencioso).

## Quick wins (baixo esforço, alto impacto)
P0.3 (surfacing de falhas via primitivos), P0.5 (gate único de export), P1.1-parcial (auto-seleção da
campanha + mesclar build+ativar), P1.5 (legibilidade do QA + link erro→corte), P1.7 (centralizar tokens).

## Melhorias estruturais
P0.1/P0.2 (motor de render: Premium full-res + 9:16 sem OOM), P1.1 (stepper/reflow), P1.3 (costura das
skills — direção de arte automática), P1.4 (golden-reference/regressão visual), batch/paralelo (escala),
alinhamento do motor de fit/posicionamento.

---

## Roadmap em FASES (ordem + dependências)
**Fase 1 — correção dos críticos (P0).** Confiabilidade de render (Premium ≥1080, 9:16 sem 546) + acabar com
falhas silenciosas + feedback de operações longas + gate único. *Dependência:* os primitivos Vitra UI já
existem (Onda 1) ✓; mexer no `render-asset` segue o padrão de deploy CLI + render real + lint (memória
[[render-asset-deploy-e-limites]]).

**Fase 2 — experiência & qualidade visual (P1 de UX).** Stepper/reflow em 4 etapas + adotar primitivos nos
4 surfaces + editar→auto re-render + QA legível/acionável + responsividade + preview multi-formato +
centralizar tokens. *Depende* da Fase 1 (preview confiável). *Sinergia* com o P1.4 (desmonte do monolito)
do roadmap geral, já que os surfaces vivem no `PremiumDashboard.jsx`.

**Fase 3 — automação, validação & escala (P1 estrutural).** Costurar `direcao-de-arte`+suggest-template+
`vitra-copy` (copy que cabe + arte → lint-aware por construção) + golden-reference/regressão visual +
validação pré-render + batch/paralelo na fila + alinhamento do motor de fit. *Depende* das Fases 1–2.

**Fase 4 — otimização contínua & novos recursos.** Loop métricas→ação (replicar vencedor), variantes A/B,
score de legibilidade no QA, comparação com referência no app, evolução de presets, novos objetivos (pixel
de Sales, leadgen ToS). *Depende* de métricas + do framework de validação da Fase 3.

## Dependências entre tarefas
Primitivos Vitra UI (Onda 1 ✓) → P0.3/P0.4/P1.6. Motor de render confiável (Fase 1) → previews/QA confiáveis
(Fase 2) → automação/validação (Fase 3) → otimização (Fase 4). Costura das skills (P1.3) depende do
`render-asset` estável + catálogo. Golden-reference depende de render determinístico (Fase 1).

## Riscos
- Mexer no `render-asset` pode **regredir OOM** → mitigar com render real + lint + retry-546 + bump de
  render-version + regen de previews (padrão estabelecido).
- Centralizar tokens pode **mudar pixels** → golden-reference + bump + revisão.
- Costurar skills pode **automatizar demais / sair de marca** → manter revisão humana + Creative Lint +
  precedência de marca (brandbook é autoridade).
- Batch/paralelo pode **estourar compute** → cap de concorrência.
- **Invariante inviolável:** Meta sempre PAUSED + activate só com confirm — nenhuma mudança altera isso.

## Testes necessários
deno check + 182 vitest + build; **render real por família** (lint.ok + inspeção visual) — o loop já usado;
**golden-PNG diff** por família no CI; testes de `copyValidation`/readiness/gate; verificação no preview
(`preview_eval`/`resize`); Meta **só em PAUSED** nos testes (nunca ativar).

## Critérios de aceite (transversais)
Nenhuma regressão funcional; build + testes verdes; a11y sem violação crítica nas telas tocadas; verificado
em 375/768/1024/1440; **identidade preservada** (sem cor/fonte fora do brandbook); render determinístico
(sem 546 em N tentativas) e ≥1080px nos 3 formatos das duas marcas; gate único de QA; falhas sempre visíveis
com recuperação.

Sem alteração de código (diagnóstico). Esta nota é o roadmap de referência do Tráfego Pago (prioridade sobre
os demais módulos).
