# Atualização 2026-06-26 — Creative Design System + Lint (P0)

Início da solução estrutural para a qualidade dos criativos (após diagnóstico crítico do template
"Bairro em destaque"). P0 entrega a **fundação reutilizável**: um Design System + um Lint visual objetivo,
e re-funda o `destino-bairro` sobre eles — corrigindo os defeitos **pela raiz**, não no pixel.

## O que entrou
### `_shared/creativeDesign.ts` (Design System — puro, Edge + Vitest)
- Fonte ÚNICA de tokens: `DS_COLORS`, `DS_FONT`, `space()` (escala base 8), `DS_RADII`.
- `formatSpec(W,H)` → canvas + margem + **SAFE ZONE do Meta por formato** (1:1 ~6,5%; 9:16 reels-safe
  y[250..1470]; 1.91:1 x[89..1111] y[63..564]).
- Geometria: `withinSafe`, `overlapArea`.

### `_shared/creativeLint.ts` (gate objetivo — puro, Edge + Vitest)
- `lintCreative(safe, elements)` recebe um **relatório de layout** e reprova problemas estruturais:
  safe-zone, **colisão entre blocos** (o selo atrás do herói), **texto sobre foto sem scrim** (rodapé
  ilegível), overflow de fonte, **limite de caracteres**, **hierarquia** (herói deve ser o maior).
- Teste `creativeLint.test.js` (8 casos) prova que o lint **pega** cada bug conhecido — incl. o do selo.

### `destino-bairro` re-fundado sobre o DS (render-asset)
- **SCRIM**: spotlight escuro localizado atrás do CTA + rodapé → rodapé **legível** sobre a foto (era o
  defeito nº1). 
- **Disciplina de dourado**: título do painel passou a BRANCO; o dourado fica reservado ao DESTAQUE da
  oferta. Painel com fill navy mais sólido + borda branca sutil.
- **1.91:1 alinhado à safe-zone real** (conteúdo de x=72 → x≥89), que o lint flagrava como violação.
- **Lint computado** a cada render (relatório de layout → `lintCreative`); erros logados no Edge.
- Render-version bump `destino-bairro-approved-v2`; 6 previews do catálogo regenerados.

## Verificação (render real, antes/depois)
deno check + lint + **172 testes** (incl. os 8 novos do lint) + build OK; deploy via CLI. Render real dos
3 formatos: rodapé agora legível (scrim), título do painel branco, conteúdo do 1.91:1 dentro da safe-zone.
Assets de teste removidos.

## O que P0 NÃO faz (próximas fases)
- **Front gate**: consumir `metadata.lint` e **bloquear a aprovação** com lint vermelho (P0.5/P2).
- **Imagem dirigida** (smart-crop por foco + grade navy) — P1.
- **Migrar os outros templates** (oferta-ancora, ficha, hero-checklist…) para o DS — P1.
- **Skill "Direção de Arte Vitra"** emitindo layout spec + ajuste de copy — P2.

Commit: DS + Lint (+teste) + destino refatorado + render-version v2 + 6 previews.
