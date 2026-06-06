# 09 - Plano de Consolidacao da Geracao de Criativos

> Nota criada em 2026-06-06 a partir de um mergulho dirigido na pipeline de geracao de
> criativos (tracers por dimensao + sintese de arquitetura). Complementa
> [[08 - Auditoria e Plano de Evolucao]] detalhando a funcionalidade central do produto:
> a fabrica de variacoes de criativos para trafego pago imobiliario.

## Objetivo de produto (a regua)
Gerar **N variacoes fieis** por campanha (logica de teste da Meta), com **fotos reais do
imovel** bem distribuidas, **copy variada**, nos **3 formatos** (1:1, 9:16, 1.91:1), de forma
**automatica e estavel**, com **minima intervencao humana**. Nao e um editor tipo Canva.

## Diagnostico em uma frase
A pipeline ja gera N x 3 variacoes deterministicamente e o caminho feliz funciona, mas **nao e
confiavel**: (1) nao havia rede de seguranca (sem testes/CI) e (2) o fluxo automatico esta
quebrado — tres "drenadores" competem/divergem, a Edge nao faz claim atomico nem marca erro, e o
cron server-side esta morto. Somam-se problemas de variacao (copy duplicada) e de uso das fotos
(slots sem semantica). A arquitetura de dados ja suporta a correcao (enum de status com
`rendering`/`error`; `metadata.source_images` com o mapa de slots; `heic-convert`/`sharp` ja
disponiveis).

## Status por dimensao

| # | Dimensao | Status | Nucleo do problema |
|---|----------|--------|--------------------|
| D1 | Fluxo de criacao de campanhas | Parcial | Valida 1 campo por vez; sem previsao de pecas; fonte externa nao pre-preenche o brief |
| D2 | Selecao de templates aprovados | Pronto | Catalogo por marca robusto; falta paridade do Premium (1 template sem recipes) |
| D3 | Geracao automatica de criativos | Parcial | Deterministica e estavel no happy path; diversidade limitada; Premium fora do contrato |
| D4 | Uso correto das imagens | Quebrado | `flattenImages` perde a semantica do slot; render duplica a 1a foto; HEIC vira placeholder mudo |
| D5 | Variacao de headlines/textos/valores/diferenciais | Parcial | `recipes[index%5]` duplica copy; preco nao varia por angulo; texto do usuario so no angulo editorial |
| D6 | Renderizacao fiel aos templates | Parcial | Premium em `SCALE=0.55` (~594px); `render-version` manual so cobre 1 dos 4 templates; `modelKey` fragil |
| D7 | Formatos 1:1 / 9:16 / 1.91:1 | Parcial | Estrutura correta (3 cortes por variacao); falta validacao de safe-zone/overflow por formato |
| D8 | Processamento automatico dos cortes | Quebrado | Depende do navegador na aba certa; cron server-side morto (placeholder de auth) |
| D9 | Integracao com Supabase | Parcial | OK; `public_url` sem cache-busting com `upsert:true` mascara re-renders |
| D10 | Estabilidade sem intervencao manual | Quebrado | 3 drenadores divergentes; sem claim atomico; assets `error`/`rendering` orfaos somem dos filtros |
| D11 | Experiencia do usuario final | Parcial | Toggle de moldura nao troca o preview; slots tecnicos crus; aprovacao peca-a-peca |

## O que preservar (ja esta certo)
- Expansao concept x 3 formatos (`META_FORMAT_BLUEPRINTS` + `buildMetaAssetBlueprints`).
- Contrato de variacao (`lockedSlots`/`mutableSlots`/`recipes`) e os 4 templates Imobiliaria full-res na Edge satori/resvg (renderer **canonico**).
- Retry com backoff e invocacao em lotes com progresso.
- `ensureCampaignSourceImages` (auto-selecao de fotos reais) — apenas protege-lo.
- Separacao por `brand_scope` e `storagePrefix` brand-aware.

## Plano faseado (ordem por dependencia/risco)

### Fase 0 - Rede de seguranca  *(CONCLUIDA em 2026-06-06)*
Testes de caracterizacao das funcoes puras de geracao/variacao + CI, antes de refatorar.
- Vitest + scripts `test`/`test:run`; `vitest.config.js` standalone (node, sem o middleware de dev).
- 41 testes cobrindo: clamp/count (3-12, default 8), N x 3 = 24 formatos, separacao de canal,
  selecao de conceitos, distribuicao de imagem por formato, catalogo/recipes e gate de render-version.
  Bugs conhecidos congelados como baseline (Premium -> [], duplicacao `recipes[index%5]`, indice global de foto).
- CI em `.github/workflows/ci.yml`: `npm ci` + `test:run` + `vite build` + `deno check` nas Edge Functions.
- Mudanca aditiva no codigo: 12 funcoes puras de `premiumData.js` ganharam `export` (sem alterar logica).

### Fase 1 - Estabilizar o fluxo automatico (a causa-raiz; D8 e D10)  *(IMPLEMENTADA na branch fase1/fluxo-automatico)*
Sem `ALTER TABLE`: tentativas/timestamp ficam em `metadata` (o enum de status ja inclui `rendering`/`error`).
- Claim atomico: funcao SQL `claim_render_assets` (`UPDATE ... RETURNING` com `FOR UPDATE SKIP LOCKED`), em dois modos: drenagem (`queued`) e explicito por ids (`queued/generated/error`, nunca `approved`/`rendering`).
- Reaper `reap_stale_render_assets`: orfao `rendering` (crash/OOM) > timeout volta a `queued` consumindo orcamento de tentativas, ou vira `error` (dead-letter) — garante TERMINACAO. Chamado pelo cron e pela Edge (best-effort) a cada invocacao.
- Maquina de estados na Edge: `rendering` ao reivindicar, `generated` no sucesso, na falha `queued` (enquanto tentativas < 3) ou `error` (dead-letter).
- Cron: troca o placeholder por leitura do Vault, so `meta_ads`, reaper antes de drenar; schedule ainda comentado (so age quando agendado manualmente).
- `render-worker` nunca reivindica `meta_ads` (`.neq channel meta_ads`) — elimina a corrida e a divergencia de motor/marca.
- Predicado unico `isRenderablePendingAsset` (queued / error com orcamento / rendering orfao / template aprovado desatualizado) usado em TODOS os pontos do dashboard, inclusive nos contadores que habilitam o botao "Gerar cortes".
- `ensureCampaignSourceImages` nao mexe em `generated`/`approved` nem ressuscita dead-letters.
- Cache-busting na `public_url` (sufixo de versao) para o re-render aparecer.
- Verificacao adversarial (4 revisores) aplicada; achados HIGH (orfao/retry infinito/job pendurado e botao desabilitado) corrigidos.
- **Pendente de deploy (gated):** aplicar as migrations no banco, criar o secret no Vault, publicar a Edge e agendar o cron — requer autorizacao.
- **Limitacoes documentadas (follow-up):** edicao de anuncio durante render ativo pode gerar 1 render duplicado; o status do job `asset_render` pode nao finalizar com precisao quando a campanha mistura motores (Edge x worker) ou termina so em dead-letter — cosmetico (o asset renderiza/dead-letter corretamente); dashboard so enxerga 600 assets (o cron nao tem esse teto).

### Fase 2 - Qualidade de variacao, fotos e fidelidade
- Acabar com a duplicacao de copy quando count > recipes (variar por ciclo / ampliar recipes); variar preco/ancora por angulo; respeitar `suggested_headline/copy` do usuario em mais variacoes.
- Selecao de fotos **slot-aware** via `metadata.source_images` (fachada/lazer corretos), em vez do indice global achatado.
- Poucas fotos sem repeticao silenciosa; parar de marcar `generated` com placeholder de foto faltante.
- Suporte a HEIC no upload (`heic-convert`).
- Resolucao Premium full-res (ajustar `SCALE=0.55`); corrigir precedencia em `modelKey`.
- Harness de validacao por formato (safe-zone/overflow).

### Fase 3 - Fidelidade de template e paridade de marca
- Unificar `render-version` numa fonte unica cobrindo os 4 templates Imobiliaria (hoje so financiamento-orla, duplicado em 2 arquivos).
- Decidir a paridade do Premium: dar recipes ao Premium ou ajustar a UI para nao prometer contrato que ele nao usa.
- Premium multi-foto onde o modelo (galeria/prova) pede.

### Fase 4 - UX: preview fiel e menos cliques
- Preview que reflete a variante (ligar `referencesForTemplateVariant`).
- Previsao numerica antes do submit; validar todos os campos de uma vez.
- Humanizar nomes de slot; estender auto-render para a aba Producao; "Aprovar todos" por campanha.

## Guardrails
- Claim atomico vai junto com o agendamento do cron (ligar o cron sem ele pioraria a corrida).
- Antes de desligar o worker, garantir o cron funcional.
- Vendorizar WASM/fontes da Edge (hoje unpkg/jsdelivr em runtime) como mitigacao de cold-start.
- Copy/preco/recipes passam pelo responsavel de marketing (tom/compliance).
- Cache-busting por parametro de versao, nao mudando o path (preserva links ja compartilhados).

## Criterio de sucesso da funcionalidade
Criar campanha e **fechar o navegador** resulta em todas as N x 3 pecas `generated` via cron, sem
clique manual; nenhum asset renderizado 2x; falhas viram `error` com limite de retry; orfaos
voltam a renderizar; com count=8 as 24 pecas tem copy distinta; templates de 2 fotos posicionam
as categorias corretas; HEIC renderiza; PNGs Premium em resolucao Meta.

## Regra de Marca
Premium (preto+dourado, editorial) e Imobiliaria (navy `#0A1628`+dourado, institucional) nao
misturam assets, linguagem, CTAs, templates ou estrategia sem validacao do Brand System Vitra.
