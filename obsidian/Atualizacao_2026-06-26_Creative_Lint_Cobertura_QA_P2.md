# Atualização 2026-06-26 — Lint no hero-checklist + erros no QA (P2, fatia 1)

Primeira fatia do P2: estende o gate de validação ao **template mais usado** (hero-checklist) e mostra os
**erros de lint por corte** no painel de QA (antes só aparecia ✓/✗).

## Cobertura do gate — hero-checklist (3º template)
- `buildVitraHeroChecklistSvg` ganhou o param `out` e monta o relatório de layout (hero/headline, preço
  De-Por, checklist, CTA) → `lintCreative` → persiste `metadata.lint`. Mesmo mecanismo de destino/oferta.
- Sem mudança de arte (mantém o tratamento de imagem atual) → **sem bump nem regen de preview**.
- Verificado: 2 cortes reais (feed + story da TOM MENINO DEUS) re-renderizados → `lint.ok=true []` nos
  dois (o hero-checklist já estava dentro da safe-zone — "safezone-v2"). O gate agora protege contra
  entradas ruins futuras (ex.: headline longa → char_limit/overflow).
- O gate de aprovação (P0.5) já consome `metadata.lint`, então passa a valer para o hero-checklist também.

## QA mostra os erros do corte (front)
- No card de QA do anúncio (Tráfego Pago), abaixo dos checks, um bloco âmbar mostra os **erros de lint do
  corte ativo** (ex.: "overflow:hero · safe_zone:bar") quando há falha. Antes o operador via só o check
  "Validação visual ✗" sem o motivo; agora vê exatamente o que corrigir.

## Estado da cobertura do lint
Templates com gate: **destino-bairro, oferta-ancora, hero-checklist** (3 de 9 selecionáveis). Os demais
(ficha, duo-selos, hero-panel, lançamento, vitrine, oportunidade) entram nas próximas fatias do P2 —
cada um threadando `out` + relatório (padrão já estabelecido).

## Verificação
deno check + lint + build OK; deploy via CLI. `metadata.lint` confirmado nos cortes do hero-checklist.
Sem assets de teste criados (reusei cortes reais já existentes; mesma arte, só somou o lint ao metadata).

## Próximo (P2)
- Migrar os templates restantes ao lint (mesma receita).
- Skill "Direção de Arte Vitra" (layout spec + ajuste de copy).
- (Opcional) overlay de safe-zone no preview do corte.

Commit: Edge (hero-checklist + lint) + front (erros de lint no QA).
