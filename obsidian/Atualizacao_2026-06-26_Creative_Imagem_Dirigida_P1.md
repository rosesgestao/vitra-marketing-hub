# Atualização 2026-06-26 — Imagem dirigida + lint em 2 templates (P1)

Continuação do design system de criativos. P1 entrega o **primitivo de imagem dirigida** (reutilizável) e
**estende o DS/lint a um segundo template** (oferta-âncora) — provando a reutilização.

## Imagem dirigida — `dsImageLayer` (render-asset, P1)
- **Enquadramento por foco** por formato: story = topo do prédio (`xMidYMin slice`); demais = centro.
  Cada formato enquadra a foto de propósito (não é mais slice central cego em todos).
- **Grade navy** sutil via **overlay** de baixa opacidade (NÃO usa filtro SVG). 
- **Aprendizado importante**: a 1ª versão usava `feColorMatrix` (dessatura + viés azul) — funcionou no
  9:16 (rasteriza menor) mas estourou o compute do isolate no **1:1 full-res** (`WORKER_RESOURCE_LIMIT`,
  o padrão 546). Trocado por overlay navy (barato, sem filtro) → coesão cromática sem risco de render.
- Aplicado a **destino-bairro** e **oferta-âncora**.

## Lint estendido ao oferta-âncora (2º template no gate)
- O builder do oferta agora expõe o relatório via `out` (mesmo mecanismo do destino); persiste
  `metadata.lint`. É um template de **DOIS FOCOS** (headline + preço-âncora), então o lint NÃO aplica a
  regra de "herói único"; valida safe-zone, colisão, overflow e char-limit.
- **O lint achou bugs reais no oferta**: (1) o 1.91:1 estava com o conteúdo FORA da safe-zone do Meta
  (x=72 < 89) — mesmo bug que o destino tinha; (2) hierarquia (arquétipo de 2 focos). Ambos **corrigidos**
  (wide alinhado a x≥89; lint ajustado ao arquétipo). Pós-fix: oferta passa nos 3 formatos.

## Verificação (render real)
deno check + lint + 172 testes + build OK; deploy via CLI. Render real:
- destino 1:1 com grade/foco — ok; lint.ok=true.
- oferta nos 3 formatos: antes lint.ok=false (safe_zone:headline/bar + hierarquia), depois do fix
  lint.ok=true []. Oferta wide agora dentro da safe-zone.
- Render-version bump destino v3 + oferta v2; **12 previews regenerados** (2 templates × 3 × 2 variantes).
  Assets de teste removidos.

## Próximo (P2)
- Skill "Direção de Arte Vitra" emitindo layout spec + ajuste de copy.
- Migrar os demais templates (ficha, hero-checklist, duo-selos…) ao DS + lint.
- Painel de QA mostrando os erros de lint por corte (hoje aparecem no check "Validação visual" + bloqueio).

Commit: dsImageLayer + destino/oferta com imagem dirigida + lint no oferta (+ fix safe-zone wide) +
render-versions v3/v2 + 12 previews.
