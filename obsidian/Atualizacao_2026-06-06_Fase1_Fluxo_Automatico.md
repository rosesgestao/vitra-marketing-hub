# Atualizacao 2026-06-06 - Fase 1: Estabilizacao do Fluxo Automatico

## Contexto

Segunda fase do plano de consolidacao da geracao de criativos
([[Ferramenta Operacional Premium/09 - Plano de Consolidacao da Geracao de Criativos]]).
Objetivo: tornar a geracao de cortes confiavel e automatica SEM depender do navegador aberto —
drenador unico server-side, claim atomico e maquina de estados com retry e dead-letter. Branch:
`fase1/fluxo-automatico`. Com a rede de seguranca da Fase 0, refatorada sem regressao.

## Mudancas (codigo)

- **Claim atomico + reaper** (`supabase/migration-render-queue-claim.sql`, novo, sem ALTER TABLE):
  - `claim_render_assets` reivindica `meta_ads` com `FOR UPDATE SKIP LOCKED` (sem corrida). Dois
    modos: drenagem (`queued`) e explicito por ids (`queued/generated/error`, nunca `approved`/`rendering`).
  - `reap_stale_render_assets` recicla orfao `rendering` (crash/OOM) apos timeout: incrementa
    tentativas e volta a `queued` (com orcamento) ou `error` (dead-letter). Garante TERMINACAO.
- **Edge `render-asset`**: chama o reaper (best-effort) e o claim a cada invocacao; na falha,
  incrementa tentativas e marca `queued` (< 3) ou `error` (dead-letter); `remaining` conta
  `queued`+`rendering`; cache-busting na `public_url`. Fallback transicional restrito a `meta_ads`
  e a estados renderizaveis caso a migration do claim ainda nao esteja aplicada.
- **Cron** (`migration-render-queue-cron.sql`): le a chave do Vault (fim do placeholder `401`),
  recicla orfaos antes de drenar, so `meta_ads`; `cron.schedule` ainda comentado.
- **Worker**: nunca reivindica `meta_ads` (a Edge satori/resvg e o renderizador canonico).
- **Frontend** (`premiumData.js`, `PremiumDashboard.jsx`): predicado unico
  `isRenderablePendingAsset` em todos os pontos (auto-render, botao manual e contadores que
  habilitam "Gerar cortes"); `ensureCampaignSourceImages` preserva arte pronta e dead-letters.
- **Testes**: `renderQueue.test.js` (8 testes do predicado). Total 49 testes verdes.

## Verificacao adversarial

Antes de commitar, 4 revisores adversariais buscaram cenarios de "nunca renderiza / renderiza 2x
/ fluxo pendura". Achados HIGH corrigidos: (1) orfao por crash gerava retry infinito e job
pendurado -> resolvido com o reaper consumindo orcamento e o cron reciclando antes de drenar;
(2) botao "Gerar cortes" ficava desabilitado para assets em `error`/orfao -> contadores passaram
a usar o predicado unico.

## Validacao

- `npm run test:run` => 49 passed; `npm run build` => ok; `deno check` render-asset + ingest => ok.
- SQL validada por DRY-RUN transacional (BEGIN ... ROLLBACK) no Postgres 17 do projeto ativo
  `birxcfkyuzqnhyvetbjv`: criou as funcoes, montou assets em todos os estados, exercitou claim +
  reaper e fez 9/9 checagens OK (claim drain/explicito, reaper requeue/dead-letter, exclusao de
  canal). Pos-rollback confirmado: 0 funcoes e 0 linhas de teste persistidas. Branching nao usado
  (exige plano Pro).

## Passos de DEPLOY (gated — exigem autorizacao)

Ordem recomendada (retrocompativel; o frontend novo funciona com a Edge atual):
1. Aplicar `supabase/migration-render-queue-claim.sql` (claim + reaper) no projeto `birxcfkyuzqnhyvetbjv`.
2. Criar o secret no Vault: `select vault.create_secret('<service_role_ou_anon_key>', 'render_asset_invoke_key');`.
3. Publicar a nova Edge `render-asset`.
4. Aplicar `migration-render-queue-cron.sql` e agendar: `select cron.schedule('drain-render-queue', '* * * * *', $$ select public.drain_render_queue(4); $$);`.
5. Deploy do frontend (qualquer momento).

## Limitacoes documentadas (follow-up)

- Editar um anuncio durante o render ativo (~segundos) pode gerar 1 render duplicado (last-writer-wins).
- O status do job `asset_render` pode nao finalizar com precisao quando a campanha mistura motores
  (Edge meta_ads x worker instagram) ou termina so em dead-letter — cosmetico; o asset renderiza/
  dead-letter corretamente. Correcao via job-por-motor.
- O dashboard so carrega 600 assets; o cron server-side nao tem esse teto (cobre a cauda).

## Proximo passo

Fase 2 - qualidade de variacao (sem copy duplicada), distribuicao slot-aware de fotos, HEIC e
resolucao Premium full-res. Ver nota 09.
