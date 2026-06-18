# Atualizacao 2026-06-18 — Conteúdo: Configurações editoriais (governança da pauta por marca)

> Tela que governa a linha editorial orgânica POR MARCA e realmente alimenta o fluxo (não é tela morta).
> Na `main`. Commit: **041f967**.

## Entregue
- **Tabela** `premium_editorial_settings` (1 linha por `brand_scope`): `active_pillars text[]`,
  `default_tone`, `cadence_per_week`, `guidelines`, `updated_at`. RLS permissiva (postura de dev: anon
  lê/escreve). Migration `supabase/migration-editorial-settings.sql` aplicada no projeto.
- **Helpers** `loadEditorialSettings(brandScope)` / `saveEditorialSettings(brandScope, {...})` (upsert por
  brand_scope) no premiumData.
- **Aba "Configurações"** (`EditorialSettingsSection`) na seção Conteúdo: pilares ativos (chips toggle),
  tom padrão, cadência (posts/semana) e **diretrizes para a IA** (textarea).
- **Fiação no fluxo** (o que torna a config viva): na aba Produção — (1) os **pilares ativos filtram** o
  seletor de Pilar (vazio = todos); (2) o **tom padrão** pré-seleciona; (3) as **diretrizes entram no
  prompt** do "Gerar posts" via `context.diretrizes_da_marca` (SEM redeploy da edge — a generate-content
  já injeta o context no brief). PremiumDashboard carrega as settings por marca e repassa.

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview: abri "Configurações", restringi a 2 pilares (autoridade,
educativo), defini cadência 4 e diretrizes; "Salvar" → DB gravou (`active_pillars [autoridade,educativo]`,
`cadence 4`, guidelines). Voltei à Produção e o seletor de **Pilar passou a listar só os 2 ativos** —
fiação ponta a ponta confirmada. Zero erro no console. Linha de teste removida (volta ao padrão neutro).

## Sequenciamento restante
2. **Biblioteca (DAM)** — próxima entrega (repositório de artes/fotos/legendas reutilizáveis; o bucket
   `cards`/`organic-art` já acumula as artes).
3. **Publicação NATIVA via Graph** — entrega dedicada (IG Business + `instagram_content_publish` + token
   de Página server-side + container/publish; pré-requisitos no Meta a alinhar com o Leonardo).

Continuacao de [[Atualizacao_2026-06-18_Conteudo_Arte_Foto_Thumbnail_Publicacao]]. Ver [[conteudo-organico]].
