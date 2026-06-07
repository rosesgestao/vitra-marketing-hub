# Changelog — Ferramenta Operacional Vitra Premium

## Sessao 2026-06-06 — Fase 2: fotos slot-aware (DEPLOY PENDENTE) + descoberta HEIC

### Fotos slot-aware (render-asset)
- `imageUrlsForApprovedTemplate`: monta a lista de fotos em ORDEM DE SLOT (fachada->0,
  living->1, varanda->2 ...) a partir de `metadata.source_images`/`brief.images`, em vez de
  prepor a foto rotacionada (`source_image_url`) na posicao 0. Novos helpers `slotOrderedUrls`/
  `urlsFromImageGroup`. Fallback para o fluxo antigo em campanhas legadas sem slots.
- financiamento-orla: usa a ordem de slot direta (localizacao->esquerda, empreendimento->direita)
  em vez de `rotateFinancingImages`, que puxava fotos aleatorias do pool (incluindo extras).
- Corrige fachada/lazer/localizacao caindo na posicao errada nos templates aprovados.
- Validado por `deno check`. **DEPLOY EM PRODUCAO PENDENTE DE AUTORIZACAO.**

### Descoberta: fotos do teste sao HEIC
- As fotos do "Teste de Criativo" (slots fachada/living) estao no Storage como `.heic` (iPhone).
  A Edge nao decodifica HEIC (so WebP/PNG/JPEG via toDataUri), entao essas fotos nao renderizam.
  Para o fluxo real do usuario, slot-aware depende de adicionar suporte a HEIC (conversao no upload).

## Sessao 2026-06-06 — Fase 2 (cont.): Aprovar todos + ampliacao de angulos

### "Aprovar todos" por campanha (P4)
- PremiumDashboard.jsx (TrafegoPagoSection): botao "Aprovar todos (N)" no cabecalho que aprova de
  uma vez todos os cortes ja gerados e prontos da campanha (reusa o `onApproveGroup` existente).
  Reduz a aprovacao peca-a-peca; gold solido, desabilitado quando nao ha cortes prontos.

### Ampliacao do leque de angulos (conteudo — financiamento-orla, draft p/ marketing)
- creativeTemplateCatalog.js: template `vitra-imobiliaria-financiamento-orla` ampliado de 5 para
  9 angulos distintos (novos: entrada-facilitada, localizacao-valoriza, pronto-pra-morar,
  simulacao). Com o cap da Fase 2, pedir 8/9 variacoes agora gera ate 9 anuncios SEM repetir copy.
  Copy em rascunho para revisao do marketing (o operador ja aprova cada criativo antes de exportar).
- Os outros 3 templates (dual-photo, patios, menino-deus) seguem com 5 angulos — ampliacao
  replicavel apos validacao da voz nesta primeira leva.
- Testes: capacidade do financiamento = 9; recipes por template >= 5. 53 testes no total.

## Sessao 2026-06-06 — Fase 2 (P1 duplicacao + P2 headline) + fix de autocomplete

Comprovado em producao no teste real: 8 variacoes com 5 receitas geravam 3 anuncios de copy
identica, e a headline longa truncava ("TESTE DE HEADLINE NO"). Correcoes:

### P1 — duplicacao de copy
- premiumData.js: `selectedTemplateVariationConcepts` capa a contagem ao numero de receitas
  distintas do template (`Math.min`), eliminando anuncios com headline/copy repetida; novo
  `distinctConceptCapacity`.
- PremiumDashboard.jsx (modal): aviso dinamico quando a contagem escolhida excede os angulos
  distintos do template ("N angulos distintos — serao gerados N anuncios sem repeticao").
- variation.test.js: baseline de duplicacao trocado por asserts de distincao; +2 testes.

### P2 — headline
- render-asset/index.ts: `wrapText` agora preenche as duas linhas e trunca a ultima com
  reticencias (em vez de cortar palavra no meio e descartar o resto) — corrige tambem casos em
  que headlines curtas perdiam palavras. Ajuda patios/dual-photo/generico.
- creativeTemplateCatalog.js: `maxLength` + helper nas headlines (financiamento 34, patios 40,
  dual-photo 44) — previne na origem a headline que nao cabe (a financiamento usa
  `financingHeadlineParts`, que rejeita headlines > 34 chars).
- PremiumDashboard.jsx: `renderTemplateField` passa a exibir o helper tambem em inputs de texto.

### Fix de UX
- Modais (Nova Campanha e edicao): `autoComplete="off"` no form e nos inputs — elimina o popup
  do navegador "Salvar documento de identidade?" que classificava a headline como dado pessoal.

### Validacao
- npm run test:run => 51 passed; npm run build => ok; deno check render-asset => ok.

## Sessao 2026-06-06 — Deploy da Fase 1 em producao

Backend da Fase 1 aplicado no projeto ativo `birxcfkyuzqnhyvetbjv`: migration claim+reaper,
secret no Vault (chave publishable), funcao do cron, Edge `render-asset` v36 (via CLI) e cron
agendado (jobid 1, a cada minuto). Verificado: Edge 200/401, pg_net 200, cron `succeeded`.
Funcoes SECURITY DEFINER travadas (`revoke ... from public`, `grant ... to service_role`).
Reconciliados os arquivos de migration (revoke/grant correto e nota da chave publishable).
Frontend retrocompativel ainda nao publicado (sem config de deploy no repo).

## Sessao 2026-06-06 — Fase 1: estabilizacao do fluxo automatico de render

Torna a geracao de cortes confiavel sem o navegador aberto: drenador unico server-side, claim
atomico, maquina de estados com retry/dead-letter e reaper de orfaos. Verificado por review
adversarial. Codigo validado localmente; passos de deploy remoto pendentes de autorizacao.

### supabase/
- migration-render-queue-claim.sql (novo): `claim_render_assets` (FOR UPDATE SKIP LOCKED, dois
  modos: drenagem `queued` e explicito por ids) e `reap_stale_render_assets` (recicla orfaos
  'rendering' com orcamento de tentativas -> 'queued' ou dead-letter 'error'). Sem ALTER TABLE
  (tentativas/timestamp em metadata).
- functions/render-asset: reaper best-effort + claim atomico (com fallback transicional);
  maquina de estados na falha (queued<3 / error dead-letter); remaining em (queued,rendering);
  cache-busting na public_url.
- migration-render-queue-cron.sql: le a chave do Vault (fim do placeholder 401), so meta_ads,
  reaper antes de drenar; schedule comentado.

### render-worker/
- src/worker.js: o claim nunca reivindica meta_ads (a Edge e canonica) — elimina a corrida e a
  divergencia de motor/marca.

### dashboard/ (React)
- src/lib/premiumData.js: predicado unico isRenderablePendingAsset/renderAttemptsFor/
  MAX_RENDER_ATTEMPTS; pendingRenderableAssetIds usa select('*')+predicado; ensureCampaignSourceImages
  preserva arte pronta e nao ressuscita dead-letters.
- src/views/PremiumDashboard.jsx: auto-render, botao manual e contadores de "Gerar cortes" usam o
  predicado unico (corrige o botao ficar desabilitado para assets em error/orfao).
- src/lib/__tests__/renderQueue.test.js (novo): 8 testes do predicado.

### Validacao
- npm run test:run => 49 passed; npm run build => ok; deno check render-asset + ingest => ok.
- Review adversarial (4 lentes): achados HIGH corrigidos (orfao/retry-infinito/job-pendurado e
  botao desabilitado).
- SQL validada por dry-run transacional (BEGIN ... ROLLBACK) no Postgres 17 do projeto ativo:
  9/9 checagens OK (claim drain e explicito, reaper requeue e dead-letter, exclusao de canal),
  sem persistir nada (confirmado 0 funcoes/0 linhas apos rollback). Branching indisponivel (exige Pro).

## Sessao 2026-06-06 — Fase 0: rede de seguranca (testes + CI)

Primeira fase do plano de consolidacao da geracao de criativos. Sem mudanca de comportamento:
trava o estado atual com testes antes de refatorar.

### dashboard/ (React)
- package.json: adicionado Vitest (devDependency) e scripts test/test:run.
- vitest.config.js (novo): config standalone (ambiente node), nao estende o vite.config para
  nao carregar o middleware de dev no runtime de teste.
- src/lib/premiumData.js: 12 funcoes puras de geracao/variacao ganharam `export` (sem alterar
  logica) para serem testadas.
- src/lib/__tests__/ (novo): 41 testes de caracterizacao (variacao, distribuicao de imagem,
  catalogo de templates, estado de render), com os bugs conhecidos congelados como baseline.

### CI
- .github/workflows/ci.yml (novo): job dashboard (npm ci + test:run + vite build) e job
  edge-functions (deno check em render-asset e ingest-source-images).

### Validacao
- npm run test:run => 41 passed; npm run build => ok (bundle identico).

## Sessao 2026-06-06 — Limpeza de honestidade da UI (sem mudanca de comportamento)

Pass de baixo risco que alinha a interface ao que esta de fato implementado. Nenhuma
alteracao de schema, fila de render, RLS ou contrato de Edge Function.

### supabase/functions/render-asset
- index.ts: removido o no que imprimia o rotulo interno do template (MODEL_LABEL) no
  canto da peca final — era texto de debug baked no PNG entregue. A constante MODEL_LABEL
  permanece (ainda usada por modelKey); o rastreio interno continua em metadata.visual_template.

### dashboard/ (React)
- src/views/PremiumDashboard.jsx: botoes "Aprovar" (AssetCard, CarouselCard, MetaAdCard)
  migrados do verde esmeralda fora de paleta (rgba(29,158,117)/#6ee7b7) para a escala gold
  do brandbook (#C4942A solido + texto #0A0A0A). Logica de estados preservada.
- src/views/PremiumDashboard.jsx: StatTile de Leads com sub "Ads Insights" (decorativo)
  trocado por "entrada manual", refletindo que as metricas hoje sao digitadas a mao.
- src/components/PremiumShell.jsx: novo componente reutilizavel RoadmapNotice.
- src/views/Agentes.jsx e Pipeline.jsx: banner RoadmapNotice deixando explicito que o squad
  de agentes / pipeline e visao de roadmap, ainda nao implementada (consultam tabelas fora
  do schema operacional Premium). Comportamento e queries inalterados.

### docs/
- escopo-oficial.md: item 6 (incompatibilidade de schema de metricas) reconciliado com o
  codigo — a incompatibilidade nao existe no repositorio; item mantido so como historico.

## Sessao 2026-06-01 — Pipeline de criativos (Fase 3) + UI de Producao

### dashboard/ (React)
- index.html: corrigida tag <link> do favicon truncada que quebrava o build.
- src/lib/premiumData.js: helpers updateAsset/approveAsset/approveAssets/requeueAsset/
  saveAssetEdit/renderCampaignAssets; CAROUSEL_LIMITS (IG 2-20, Meta Ads 2-10); phaseForBlueprint
  e gravacao de campaign_phase no metadata.
- src/views/PremiumDashboard.jsx: aba Producao virou vitrine de criativos (preview, filtros,
  badges, contadores, progresso, Aprovar/Editar, carrossel agrupado com pager+validacao,
  agrupamento por fase, trigger automatico de render ao criar campanha).

### supabase/
- functions/render-asset: Edge Function satori->resvg (post/story/carrossel, logo aprovado,
  paleta 100% brandbook) que sobe ao bucket cards e atualiza assets/jobs.
- migration-cards-storage-bucket.sql / migration-render-queue-cron.sql.

### render-worker/ (novo)
- Worker Node+Puppeteer dedicado para render full-res, consumindo a mesma fila.
