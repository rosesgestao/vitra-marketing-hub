# Atualizacao 2026-06-06 — Fase 2/3: fechar a fabrica de criativos

> Mapeamento multi-agente das 3 frentes para fechar a fabrica (render-version, validacao por
> formato, Premium full-res) + execucao. Ordem por risco: ganhos sem deploy primeiro, deploy de
> Edge por ultimo. Complementa [[Ferramenta Operacional Premium/09 - Plano de Consolidacao da Geracao de Criativos]].

## #1 — render-version com fonte unica no catalogo (frontend-only)
O mapa de versao de render (cache-busting) estava num literal solto em `premiumData.js`, duplicado
na Edge. Movido para o catalogo canonico (`creativeTemplateCatalog.js`): campo `renderVersion` por
template + helper `renderVersionForFamily` + mapa derivado. **Comportamento identico** (so
`financiamento-orla` versionado). Teste de guarda anti-divergencia com o espelho da Edge.

## #2 — harness de overflow de texto (rede de seguranca, sem deploy)
O `render-asset` (Edge) nao tinha NENHUM teste. Funcoes puras de texto (`wrapText`/`compactText`/
`textSizeForWidth`/`approvedTemplateLayout`/`DIMS`) extraidas para `supabase/functions/_shared/
textFit.ts` (sem imports Deno) e re-importadas no `index.ts` — comportamento identico (`deno check`
ok). Novo: estimador de largura por glifo + `validateApprovedHeadline` (so SINALIZA overflow).
Testes Vitest importam o modulo da Edge e demonstram o ponto cego da contagem de caracteres
(18 "W" estouram, 18 "I" cabem). Documenta a inconsistencia do 1.91:1 (cap 18 vs headlineChars 24).

## #5 — Premium full-res por formato (deploy + secret)
- O caminho Premium (satori) saia a `SCALE=0.55` (~594px, abaixo do minimo Meta de 1080).
- **Teste em producao:** full-res `1.0` renderiza **1:1 (1080x1080, verificado)** e **1.91:1
  (1200x628)**, mas o **9:16 (1080x1920) ESTOUROU** o compute da Edge no satori
  (`WORKER_RESOURCE_LIMIT`). O caminho Imobiliaria ja e full-res (SVG direto, mais leve).
- **Solucao:** `SCALE` por formato, por secret: `PREMIUM_RENDER_SCALE=1.0` (1:1/1.91:1) +
  `PREMIUM_RENDER_SCALE_TALL=0.75` (9:16 -> 810x1440, +37% vs antes). Rollback por secret sem redeploy.
- Resultado verificado: 1:1=1080x1080, 1.91:1=1200x628, 9:16=810x1440.

## Estado e deploys
- Tudo na `main`, CI verde. Edge `render-asset` re-deployada (via CLI, ja com o modulo `_shared`).
- Secrets de Edge: `PREMIUM_RENDER_SCALE=1.0` (o resto default). Imobiliaria inalterada.
- Itens que sobraram da Fase 2/3 (precisam de deploy/decisao):
  - **#3** render-version fase Edge (eliminar a copia literal no `index.ts` + cobrir as 4 families
    em release sincronizado).
  - **#4** auto-fit atuacao (corrigir o cap do 1.91:1 e `compactText` por formato — protegido pelo harness #2).
  - **9:16 full-res REAL** (1080x1920): rotear Premium ao render-worker (Puppeteer), fora do limite da Edge.

## Regra de Marca (inalterada)
Premium (preto+dourado, editorial) e Imobiliaria (navy + dourado, institucional) nao misturam
assets, linguagem, CTAs, templates ou estrategia sem validacao do Brand System Vitra.
