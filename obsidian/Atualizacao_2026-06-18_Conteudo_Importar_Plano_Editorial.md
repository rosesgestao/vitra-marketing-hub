# Atualizacao 2026-06-18 — Conteúdo: "Importar plano" (skill → board em lote)

> Fecha o ciclo planejamento → produção: o plano editorial gerado pela skill `vitra-conteudo` (JSON no
> formato createContentPost) entra em lote como rascunhos no funil. Na `main`. Commit: **43553f4**.

## Entregue
- **`importContentPlan(items, { brandScope, campaignId })`** (premiumData): percorre a lista de posts do
  plano e cria cada um via `createContentPost`. Tolerante a falha por item (não interrompe o lote);
  devolve `{ created, failed, errors }`. Cada post nasce **draft**, com `scheduled_for` preservado
  (aparece no Calendário) e `source: 'editorial_plan_import'`.
- **`createContentPost` ganhou `scheduledFor` e `source`** (antes só status draft sem data) — para o
  import gravar a data do plano e marcar a origem.
- **UI — 3º modo "Importar plano"** na aba Produção (ao lado de "Gerar posts" e "Criar do zero"):
  textarea para colar o JSON + botão Importar + resultado ("N rascunho(s) criado(s)") e lista de erros
  por item. Aceita array puro ou `{ posts: [...] }`. Vínculo de oferta segue contextual (usa a oferta em
  foco como fallback; "Sem oferta" = conteúdo de marca).

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview: colei um plano de 2 posts (educativo/carrossel + autoridade/feed)
e importei → "2 rascunho(s) criado(s)". No banco: ambos `draft`, `scheduled_for` 06/07 e 07/07,
pilar/formato/content_type corretos, `brand_scope=vitra_imobiliaria`, `source=editorial_plan_import`.
Zero erro no console. Posts de teste removidos via service-role.

## Ciclo agora fechado
skill `vitra-conteudo` (planeja o mês) → **Importar plano** (vira rascunhos) → funil
(Aprovar → Agendar → Publicar) → Calendário/board → métricas. Planejamento, produção, organização,
publicação e acompanhamento conectados.

Continuacao de [[Atualizacao_2026-06-18_Skill_Vitra_Conteudo_Planejador_Editorial]]. Ver [[conteudo-organico]].
