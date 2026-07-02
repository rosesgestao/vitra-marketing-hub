# Etapa 7 — regressão visual golden (2026-07-02)

Fecha a **última grande peça** da spec. Pega mudanças VISUAIS que nem o lint (geometria) nem o baseline de
métricas veem — ex.: uma cor de gradiente trocada, uma forma deslocada, um tratamento de imagem alterado.

## Insight (por que SHA, não pixel-diff com libs)
O render é **byte-determinístico** (provado à exaustão nos byte-diffs: mesmo input → mesmos bytes). Então o
golden pode ser o **SHA-1 do PNG** — pega QUALQUER diferença de 1 byte, com footprint mínimo (SHAs num
JSON, **não** 75 PNGs de ~1MB no repo) e **zero dependência** nova (pixelmatch/pngjs). Consistente com a
filosofia determinística do sistema. Num upgrade de fonte/Resvg todos mudam → regerar após revisão visual.

## Entregue (integrado ao harness — fonte única de "renderiza e checa")
- **`creative-qa-visual.json`** (novo, versionado): `${fam}/${content}/${format}` → SHA-1 do PNG.
  **75 entradas — cobertura TOTAL** (10 famílias, incl. Premium e as duas de lançamento que não têm
  métricas; todo render gera PNG → todo fixture tem golden visual, ao contrário do baseline de métricas).
- **`creative-qa.mjs`**: `readPngSha(id)` (lê public_url → fetch → SHA-1). No run normal, compara o SHA ao
  golden; diferença em fixture que passaria no ok → **FAIL** (CI pega). Só busca o PNG se for `--update-visual`
  ou se houver golden p/ a chave (economiza fetch). Flag **`--update-visual`** regrava (merge por `--family`).
  Convive com `--update-baseline` (podem rodar juntos).

## Verificação (as duas direções)
- Golden gerado do Edge atual → `oferta-ancora` **12/12 PASS, zero regressão visual + zero drift de métrica**
  (o SHA de agora bate o golden de minutos atrás → byte-estabilidade entre runs confirmada).
- **Prova de detecção:** corrompi o SHA golden de `oferta/medio/feed` → **`FAIL — regressão visual: SHA
  62366cf034 ≠ golden deadbeef34`** (sai 1). Restaurado via `--update-visual --family oferta-ancora`
  (merge; SHA real `62366cf0341c…` = o mesmo dos byte-diffs anteriores). node --check OK.

## O harness agora protege em 3 camadas
1. **`ok`** — o gate determinístico (erros bloqueiam).
2. **métricas golden** — regressões sutis que não quebram o ok (fill/contraste/gap…).
3. **SHA golden** — QUALQUER mudança de pixel (o que 1 e 2 não veem).
Tudo × curto/médio/vazio + estresse × 3 formatos × Imob + Premium.

## Estado da spec — NÚCLEO COMPLETO
Etapas 1 (tokens) · 2 (componentes) · 3 (schemas/zonas) · 4 (lint v3) · 5 (render_trace) · 6 (harness+
Premium+baseline) · 7 (regressão visual) · 8 (guard governança) — **todas ✅**. Restam só pendências
MENORES (não bloqueiam): estender contraste WCAG às outras 5 famílias + sobre foto (raster),
format_divergence, promover logo_crowding a erro por arquétipo, imagem H/V/Q como eixo de fixture,
governança documental (ciclo de vida/changelog DS na spec §8). Débito de marca a decidir: Poppins→Inter,
near-whites→offWhite, #111111→navyDeep. [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
