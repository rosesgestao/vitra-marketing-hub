# Atualizacao 2026-06-17 — Conteúdo Fase B: aba Produção conteudo-first

> A aba **Produção** vira a estacao de criacao de conteudo organico: "Novo conteúdo" via IA, grava em
> `premium_content_posts`. Reaproveita a infra (sem tabelas novas). Na `main`. Commit: **d9ff490**.

## Entregue
- **`ContentProductionSection`** (no topo da aba Produção, antes das peças visuais/assets):
  - Seletores **Tipo · Pilar · Formato · Tom** (VitraSelect, do `contentPlaybook`); tipo sugere pilar+formato.
  - **Briefing leve** (tema/contexto opcional).
  - **"Gerar com IA"** -> `generate-content` -> 3 ideias com **legenda editavel**, CTA, hashtags, roteiro,
    direcao visual e badges de issue (validacao de marca).
  - **"Salvar conteúdo"** -> `createContentPost` grava na oferta em foco.
  - Lista "Conteúdos desta oferta" (titulo + status).
- **Helper `createContentPost`** (premiumData): grava em `premium_content_posts` reusando as colunas
  reais. Schema descoberto (sem MCP): `campaign_id` **NOT NULL** (= oferta em foco), `status` segue o
  CHECK `draft|planned|in_copy|in_design|review|approved|scheduled|published|archived` -> salvamos como
  **`draft`**; direcao visual/roteiro/source vao em `metadata`. Save **guardado** quando nao ha oferta.

## Decisao de modelagem (importante)
NAO criamos tabelas novas: conteudo organico mora em `premium_content_posts` (ja existente). Status do
banco e EN; o Kanban (Conteúdos) usa labels PT (planejado/em_criacao/...) — **divergencia pre-existente**
a alinhar numa Fase C (mapear status EN<->board). Por isso a copy diz "rascunho", nao "Planejado".

## Verificacao
deno check, lint, 155 testes, build OK. Ao vivo: geracao on-brand (3 ideias, voz Imobiliaria/Premium) +
`createContentPost` com **insert real** (id 43dd31ff, status draft, FK valida) e depois removido. O clique
de salvar-com-oferta na UI nao foi exercido porque o **load do workspace estourou o timeout de 8s** no
preview (mensagem "Tempo esgotado ao consultar o Supabase Premium") — zera o dashboard inteiro
(campanhas/assets/pubs = 0); e AMBIENTAL, nao da Fase B (o `createContentPost` foi provado no nivel do dado).

## Resta (Fases C/D)
- Fase C: Calendário + publicacao manual (marcar publicado + link); alinhar status EN<->board Conteúdos.
- Fase D: metricas organicas (corte Orgânico|Pago) + Biblioteca/Config.
- Possivel ajuste: subir o `withTimeout` do loadPremiumWorkspace (8s) se o timeout recorrer.

Continuacao de [[Atualizacao_2026-06-17_Conteudo_FaseA_IA_Editorial]]. Ver [[conteudo-organico]].
