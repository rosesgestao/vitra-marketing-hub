# Atualizacao 2026-06-16 — Fix: 546/"CORS" no render-asset ao gerar cortes

> Cortes de campanha falhando ("X com erro") com erros de **CORS** + **546** no console do render-asset.
> Causa real: contencao de recursos por execucoes de render CONCORRENTES. Corrigido com fila unica no
> cliente, sem tocar no edge. Na `main`. Commit: **341a305**.

## Causa-raiz
O edge `render-asset` ja renderiza **1 corte por chamada** (batch=1) e tem CORS/auth corretos. Mas as
EXECUCOES de `renderCampaignAssets` nao eram serializadas entre si: o **auto-render** (efeito da tela) e
o **disparo manual / re-triggers** abriam isolates PARALELOS do edge que competiam pelo limite de
CPU/memoria do worker e estouravam em **546 (WORKER_RESOURCE_LIMIT)**. Em kill 546 o gateway **nao
devolve o header CORS**, entao o browser reporta como erro de **"CORS"** — o sintoma que aparecia no
print, confundindo o diagnostico.

## Correcao (minima, nao-destrutiva)
`premiumData.js`: `renderCampaignAssets` agora passa por uma **fila unica** (`renderChain`) — uma
execucao por vez em todo o app. Render ja e 1-a-1 por design, entao enfileirar **nao muda o resultado**:
so remove a contencao e mantem o isolate quente entre cortes. **Nao** mexi no edge, no output, nem em
outras funcoes. Retry interno (3x) + reprocessamento seguem como rede de seguranca para 546 isolado.

## Verificacao
lint, 151 testes, build OK. Smoke no preview: o modulo carrega, o export existe e duas execucoes
concorrentes **serializam** (ambas settle; ~1,5s = uma esperou a outra) sem quebrar.

Ver [[render-asset-deploy-e-limites]].
