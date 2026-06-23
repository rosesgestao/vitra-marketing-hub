# Atualizacao 2026-06-23 — render-asset endurecido para 9:16 (sem reenfileiramento manual)

> O 9:16 deixa de estourar (WORKER_RESOURCE_LIMIT/OOM) e se recupera sozinho. Na `main`. Commit: **<HASH>**.

## Causa raiz
O 9:16 da Imobiliaria renderiza em **full 1080x1920** pelo motor SVG-direto (resvg) — o `SCALE_TALL` so
afetava o caminho Premium/satori. Em isolate frio, o pico de memoria do resvg full-res estourava o compute
da Edge (`WORKER_RESOURCE_LIMIT`), que **mata o isolate**: o asset ficava preso em `rendering` e o operador
precisava reenfileirar na mao.

## Endurecimento (edge `render-asset`)
- **Teto de rasterizacao do 9:16** para AMBOS os motores (`TALL_RASTER`, default **0.85** → 918x1632,
  -28% de memoria), ajustavel pelo secret `PREMIUM_RENDER_TALL_RASTER` sem redeploy. Mantem viewBox/safe
  zone; so reduz a largura de raster. (O `SCALE_TALL` do Premium segue existindo.)
- **1 corte alto por invocacao**: o probe detecta 9:16 pendente e força `limit=1`, para nunca empilhar dois
  1080x1920 na mesma chamada (causa de OOM em lote) — inclusive na Imobiliaria.
- **Reaper mais rapido** (orfaos `rendering` reciclados em **3 min**, antes 10) e **+1 tentativa**
  (`MAX_RENDER_ATTEMPTS` 3→4).

## Rede de seguranca (cliente `premiumData`)
- `WORKER_RESOURCE_LIMIT` / "compute resources" agora conta como **erro transitorio**.
- Antes de re-tentar o chunk, **reseta os cortes presos em `rendering` de volta para `queued`** (o OOM mata
  o isolate sem liberar o claim), para que a tentativa seguinte (isolate quente + raster reduzido) renderize
  — **sem reenfileiramento manual**. 4 tentativas, backoff maior.

## Verificacao (ao vivo)
- deno check + lint + **162 testes** + build OK; deploy CLI.
- Render de um 9:16 do Murano (o que mais estourava): **rendered:1 de primeira**; PNG valido **918x1632**
  (= 1080×0.85), 1,69 MB. Confirmado via IHDR.

Ver [[Atualizacao_2026-06-23_Per_Placement_IG_e_Render_3_Formatos]] e [[render-asset-deploy-e-limites]].
