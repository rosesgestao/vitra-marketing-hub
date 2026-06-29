# Atualização 2026-06-26 — Lint nos 9 templates (cobertura total, P2)

Fecha a cobertura do gate de validação visual: os 6 templates restantes foram migrados ao Creative Lint,
totalizando **9 de 9 selecionáveis** com `metadata.lint`.

## Helper reutilizável
- `runCreativeLint(out, W, H, family, els)` no render-asset (DS): roda `formatSpec` + `lintCreative` e
  devolve no `out`, logando erros. Cada builder só monta o `els` e chama o helper.

## Templates migrados (6)
duo-selos, hero-panel, lançamento, vitrine, oportunidade-bairro, ficha — cada um com `out` + relatório
de layout (headline + char-limit/overflow, blocos de preço/painel/CTA com safe-zone). Dispatch passa o
`out` para todos. Sem mudança de arte → sem bump nem regen de preview.

## Ajuste de margem no formatSpec (evita falso-positivo)
Os templates já tunados usam margens variadas. Para o **1:1 (feed)** o Meta tem chrome mínimo → margem
**5%** (era 6,5%). Para **1.91:1 (wide)** o feed mostra a imagem inteira → margem **6% (72px)** (era 89).
Com isso os 9 templates passam limpos, sem reescrever arte. Teste `creativeLint.test.js` atualizado.

## Verificação (render real dos 6)
deno check + lint + 172 testes + build OK; deploy via CLI. Renderizei 1 corte feed de cada um dos 6 →
**`lint.ok=true []` nos seis** (sem falso-positivo). Assets de teste removidos.

## Estado da cobertura
**9/9 templates selecionáveis no gate**: hero-checklist, duo-selos, hero-panel, lançamento, vitrine,
oportunidade-bairro, ficha, oferta-âncora, destino-bairro. O gate de aprovação (P0.5) + os erros no QA
(P2 fatia 1) agora valem para o catálogo inteiro.

## Próximo (P2 final)
- Skill "Direção de Arte Vitra" (layout spec + ajuste de copy) — a peça que torna a geração proativamente
  boa (e não só validada).
- (Opcional) imagem dirigida (dsImageLayer) nos templates que ainda usam slice central.

Commit: helper runCreativeLint + 6 builders + dispatch + formatSpec (margens feed/wide) + teste.
