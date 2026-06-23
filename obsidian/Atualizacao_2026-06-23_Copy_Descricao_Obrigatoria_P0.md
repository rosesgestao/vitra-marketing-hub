# Atualizacao 2026-06-23 — P0 Copy: descrição obrigatória + IA nos 3 formatos

> Corrige a "Descrição" vazia nos anúncios (print do Murano) e fecha o fluxo vitra-copy. Na `main`. Commit: **<HASH>**.

## Diagnóstico que originou (Murano)
Todos os anúncios pagos (`hero-panel-gallery-{feed,story,wide}`, 3 conceitos) com **`descricao` = null** → campo
"Descrição" vazio no Gerenciador. Causa raiz dupla:
1. **Edge `generate-copy` descartava `description`** na montagem da resposta (gerava, mas não repassava) →
   a porta in-app nunca recebia a descrição.
2. **Nada exigia descrição** antes de publicar (campo "opcional").

## Correções (P0)
- **`generate-copy`:** passa a incluir `description` no objeto de retorno (era omitido na linha do `.map`). Redeploy CLI.
- **`build_draft`:** descrição é **obrigatória** — criativo sem descrição é **pulado** com motivo claro em
  `skipped_creatives` ("descrição vazia (campo obrigatório…)"), em vez de publicar incompleto.
- **UI (PremiumDashboard):**
  - `evaluateMetaAdReadiness`: novo check dedicado **"Descrição"** (entra no QA-ready).
  - Gate de publicação (`publishableAssets`): exige `meta_ad.descricao`; mensagem do que falta atualizada.
  - `AdEditModal`: campo **"Descrição (obrigatória)"** com borda âmbar + aviso quando vazio; **Salvar
    bloqueado** sem descrição. "Gerar 3 ângulos" (vitra-copy) preenche os 3 campos e `saveAd` **propaga aos
    3 cortes** (feed/story/wide) do conceito de uma vez.

## Verificação (ao vivo + curl + banco)
- curl `generate-copy` antes do fix: `description=None`; depois: descrição preenchida nos 3 ângulos.
- UI: modal bloqueia Salvar sem descrição; "Gerar 3 ângulos" → aplicar → descrição preenche → Salvar libera.
- Banco: após salvar, **os 3 cortes** do conceito "Oportunidade por" ficaram com a mesma descrição.
- build na Murano (descrição vazia) → todos os criativos **pulados** com motivo, 0 anúncio criado.
- deno check + lint + **162 testes** + build OK; deploys CLI (generate-copy + publish-meta-ads).

## Pendente → P1 (criativos por formato)
Hoje o build anexa **1 imagem por anúncio** (`link_data.picture`) e a Meta recorta sozinha; as artes 9:16 e
1.91:1 prontas não são usadas. P1: `asset_feed_spec` com `placement_asset_customization` (1:1→feed,
9:16→story/reels, 1.91:1→coluna/horizontal) + garantir render dos 3 formatos.

Ver [[Atualizacao_2026-06-22_Multi_Anunciantes_Desativado]].
