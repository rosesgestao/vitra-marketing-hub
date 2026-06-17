# Atualizacao 2026-06-17 — Conteúdo Fase C: board+calendário unificados + publicar/agendar + fix timeout

> Fecha o ciclo do canal organico: Produção CRIA -> board ACOMPANHA -> calendário AGENDA, tudo sobre a
> MESMA fonte (`premium_content_posts`). + manual publish/agendar + fix do timeout do dashboard. Na
> `main`. Commit: **090414c**.

## Diagnostico
O board "Conteúdos" (Kanban) e o "Calendário" liam tabelas LEGADAS (`conteudos`, `calendario_editorial`)
— separadas de `premium_content_posts` (onde a Fase B grava). Por isso o conteudo criado nao aparecia.
Status tambem divergia: board em PT (planejado/em_criacao...) x banco em EN (draft/in_copy/...).

## Entregue
- **Status como FONTE UNICA** (`contentPlaybook`): `CONTENT_STATUSES` (valores do CHECK do banco),
  `CONTENT_BOARD_LANES` (rascunho/produção/revisão/aprovado/agendado/publicado), `contentStatusLane`/
  `contentStatusLabel`, `CONTENT_STATUS_OPTIONS`. Fim da divergencia PT x EN.
- **Board Conteúdos (Kanban) REAPONTADO** -> `premium_content_posts`; agrupa por `contentStatusLane`;
  cards com title/plataforma/formato/scheduled_for/status. Read-only.
- **Calendário REAPONTADO** -> `premium_content_posts` por `scheduled_for` (proximas 3 semanas), filtro
  por plataforma, status label unificado.
- **Fase C — publicar/agendar**: helper `updateContentPost` (status / scheduled_for / published_url em
  metadata) + controles na lista "Conteúdos desta oferta" da aba Produção: trocar **status**, **Agendar**
  (data) e **Marcar publicado** (com link). Marcacao manual (MVP, sem API de publicacao).
- **Estabilidade**: `withTimeout` do `loadPremiumWorkspace` 8s -> 20s (8 queries paralelas estouravam em
  ambiente lento -> "Tempo esgotado" -> dashboard zerado).
- Teste do modelo de status.

## Verificacao (ao vivo)
deno-shared via build; lint, testes, build OK. No preview: dashboard carregou **6 campanhas sem timeout**;
**gerar + salvar** conteudo ("Salvo no board"); board Conteúdos lendo `premium_content_posts` (**6 lanes**,
56 itens); `updateContentPost` agendou (scheduled + scheduled_for) e publicou (published + link) com
persistencia. Dados de teste removidos.

## Resta (Fase D)
Metricas organicas (corte Orgânico|Pago na Métricas transversal) + Biblioteca/Config editorial. Possivel:
publicacao nativa via Graph (Instagram/Facebook organico) e migrar dados legados de `conteudos` se houver.

Continuacao de [[Atualizacao_2026-06-17_Conteudo_FaseB_Producao_Novo_Conteudo]]. Ver [[conteudo-organico]].
