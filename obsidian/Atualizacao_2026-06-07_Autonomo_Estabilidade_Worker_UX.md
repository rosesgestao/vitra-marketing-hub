# Atualizacao 2026-06-07 — Sessao autonoma: estabilidade + worker prep + Fase 4 UX

> Continuacao em modo autonomo apos [[Atualizacao_2026-06-06_Fase2-3_Fechar_Fabrica]]. Detalhe
> tecnico no CHANGELOG.md (raiz). Tudo na `main`, CI verde.

## Fase 2/3 fechada (com deploy)
- **#3 render-version**: fonte unica tambem na Edge (`supabase/functions/_shared/renderVersions.ts`);
  teste de guarda importa o arquivo real da Edge (anti-divergencia no CI).
- **#4 auto-fit por largura**: a headline do template aprovado encolhe por LARGURA estimada
  (`fitFontSize`, mesmo motor do harness #2), nao por contagem de caracteres; cap de quebra alinhado
  ao layout. Verificado: "Isla Zona Sul: valor para avaliar agora" (39 chars) cabe INTEIRA no 1.91:1
  (antes truncava "VALOR PARA AVALIA...").
- **#5 Premium full-res** entregue por formato: 1:1=1080x1080, 1.91:1=1200x628 (full Meta), 9:16=810x1440
  (o satori da Edge estoura no 9:16 full-res; teto de 0.75). Secret `PREMIUM_RENDER_SCALE=1.0`.

## Estabilidade (raiz de um OOM que o re-render em lote revelou)
- Renderizar VARIOS Premium full-res numa so invocacao da Edge da OOM em lote. A Edge agora **capa o
  limit em 1 para Premium** (probe do brand_scope); Imobiliaria (SVG leve) mantem 3. Protege cron e
  dashboard. Re-render dos Premium antigos para full-res: 82/84 (resto se cura via reaper+cron).

## render-worker — prep DORMENTE (pronto pra ligar)
- O worker Puppeteer faz o 9:16 full-res REAL (1080x1920), que o satori nao aguenta. Preparado SEM
  hospedar: `fly.toml`, foto via transform do Storage, roteamento por flag `metadata.render_engine=
  'worker'` (so Premium 9:16), `migration-render-queue-worker-route.sql` (NAO aplicada), claim do
  worker ajustado, testes. Tudo OFF por padrao.
- **Para ATIVAR (decisao do usuario):** hospedar o worker (Fly/Railway/Render) + `fly deploy` +
  aplicar a migration + ligar `VITE_WORKER_RENDER_9X16`. A Imobiliaria 9:16 NAO precisa do worker.

## Fase 4 — UX da Nova Campanha (frontend, sem deploy)
- Previsao numerica de pecas sempre visivel ("N anuncios x 3 = 3N cortes").
- Preview com as 3 referencias aprovadas que reflete o toggle de moldura (`referencesForTemplateVariant`).
- Nomes de slot humanizados (pt-BR) nos chips de variacao (`SLOT_LABELS`).
- Validacao de TODOS os obrigatorios de uma vez (antes um por vez).

## Pendente (gated no usuario) / proximo
- **Ativar o worker** (hosting) — destrava o 9:16 1080x1920 real.
- **Ampliar a copy** (20 angulos + reescrita dos fillers) — aguarda aval do marketing (Brand System).
- **Integracao Meta** (publicar/medir) — depende de contas/tokens.
- **Seguranca** (RLS/auth/bucket) — antes de qualquer deploy publico do dashboard.
- Fase 4 restante: estender o auto-render para a aba Producao.
