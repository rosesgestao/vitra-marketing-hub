# Atualização 2026-06-26 — Skill "Direção de Arte" + fix de fit de headline (P2 final)

A camada **proativa** do sistema de criativos: uma skill que, dado um imóvel, **escolhe o template**,
**afina a copy às restrições reais de cada campo** (para nunca truncar) e **dirige a arte** (moldura,
grade/foco, ordem das fotos). É o par do Creative Lint: o lint valida DEPOIS; a skill faz nascer bom ANTES.

## A skill (`.claude/skills/direcao-de-arte/`)
- `SKILL.md` — diretor de arte sênior. Fronteira dura (só propõe; só Imobiliária; **caber não é opcional**;
  não inventar dados). Fluxo: ler fatos + autoridade (catálogo) → escolher template pelo `bestFor` →
  afinar copy ao `maxLength`/cap de cada campo → dirigir knobs → **pré-flight** (copy_fit por campo) →
  entregar **relatório markdown + JSON** que semeia a peça. Saída lint-aware por construção.
- `references/playbook-direcao-arte.md` — tabela das **9 famílias** selecionáveis: gatilho (quando usar),
  arquétipo de imagem (full-bleed vs galeria → quais knobs), campos com `maxLength`/caps e as regras de
  copy/arte. Espelha o código (autoridade é o catálogo + creativeDesign + creativeLint + copyValidation).
- Reusa, não reinventa: `creativeTemplateCatalog.js` (schemas/bestFor), `_shared/creativeDesign.ts`
  (safe-zone), `creativeLint.ts` (gate), `copyValidation.ts` (voz), `dsImageLayer`/`templateFrame`.
- Complementa (sem sobrepor): **vitra-copy** (ângulos de copy genéricos) e **gerar-criativo** (HTML na hora).
  A direção-de-arte encaixa a copy no SLOT de um template e produz o brief do pipeline oficial.

## Protótipo validado (fecha o loop) + bug de motor que ele expôs
Rodei a skill no caso real que vimos truncar ("2 DORMS JUNTO À…"): argumento = bairro+preço+atributos →
**oportunidade-bairro**; copy afinada ao slot `suggested_headline` ≤28 ("2 dorms no Menino Deus", 22).
Renderizei → `lint.ok=true []`, **mas a headline ainda truncou** ("2 DORMS NO MENIN…").

**Causa (motor):** `buildVitraOportunidadeSvg` quebrava a headline com `wrapText(headline, 9, 2)` no
feed/story — **9 chars/linha × 2 = ~18 efetivos**, contra o `maxLength: 28` do catálogo. Pior: até o uso
pretendido do template ("Menino Deus", 11 chars) truncava. O `fitDisplaySize` já encolhe a fonte na
largura, então o cap baixo só causava reticência sem necessidade.

**Fix:** cap → **14** (= 2×14 ≈ o limite 28, tornando-o honesto). Re-render: **"2 DORMS NO / MENINO DEUS"**
inteiro, sem reticência. Bump `oportunidade-bairro-headfit-v3` (espelhado no catálogo) + 6 previews do
oportunidade regerados (a headline de placeholder "2 dorms junto à Av. Ipiranga" agora cabe em 2 linhas).

## Correção de fixture (dívida do P1)
O teste `templateCatalog` tem uma fixture **hardcoded** das strings de versão. O bump do P1
(hero-checklist→v4) a deixou vermelha, mas passou batido no commit anterior (rodei só `tail -3` da suíte,
que escondeu o resumo de falha). Atualizei a fixture para `hero-checklist-ds-image-v4`. **172/172 verde.**

## Verificação
deno check + lint + **172 testes** + build OK; deploy CLI. Protótipo: `lint.ok=true []` + headline completa
(inspeção visual). 6 previews do oportunidade regerados (todos `lint.ok=true`). Assets de teste removidos.

## Estado do plano (Design System de criativos)
- ✅ P0 (design system) · ✅ P0.5 (gate de aprovação) · ✅ P1 (imagem dirigida) · ✅ P2 (lint 9/9 + QA +
  **skill Direção de Arte**). Os três pilares estão de pé: **proativo** (skill) + **dirigido** (dsImageLayer)
  + **reativo** (lint). O criativo agora nasce bom, é dirigido e é provado bom.

## Próximo (opcional)
- Semear o brief da skill direto em "Nova Campanha" (auto-fill dos campos a partir do JSON).
- Alinhar os `maxLength` do catálogo ao fit real dos demais templates (a skill expôs que podem divergir).
- Grade sutil nos tiles de galeria, se quisermos coesão também ali.

Commit: skill direcao-de-arte (SKILL.md + playbook) + fix wrapText oportunidade + bump/preview + fixture.
