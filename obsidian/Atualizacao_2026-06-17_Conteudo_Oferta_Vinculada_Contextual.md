# Atualizacao 2026-06-17 — Conteúdo: "Oferta vinculada" contextual (content-first, Opcao A)

> A obrigatoriedade da "Oferta em foco" para criar conteúdo era HERANCA do schema (campaign_id NOT NULL),
> nao decisao de produto. Conteúdo de marca (institucional, bastidores, educativo, autoridade) passa a
> nascer SEM oferta. Na `main`. Commit: **e59d5d0**.

## Diagnostico (PO + dev senior)
A seção Conteúdo ja nasceu content-first (Fase B), mas o conteúdo era forçado a "morar" sob uma oferta
porque `premium_content_posts.campaign_id` era **NOT NULL**. Isso quebrava 3 coisas:
- **Conceitual**: oferta/campanha e conceito de lançamento/tráfego pago — post institucional nao pertence a uma oferta.
- **Operacional**: obrigava vincular uma oferta falsa a um post de autoridade, contaminando relatorios.
- **UX**: o bloco "Conteúdos desta oferta" sumia ao trocar a oferta em foco — o tracker virava refem do picker.

## Entregue (Opcao A)
- **Migration** `supabase/migration-content-campaign-nullable.sql`: `ALTER TABLE premium_content_posts
  ALTER COLUMN campaign_id DROP NOT NULL`. Aplicada via MCP no projeto birxcfkyuzqnhyvetbjv (is_nullable=YES).
- **contentPlaybook.ts**: campo `offer: "required" | "suggested" | "none"` por tipo + helper
  `contentTypeOffer()`. Mapa: institucional/bastidores/educativo/autoridade/captacao/parcerias_b2b/
  lifestyle_bairro = **none**; imovel/oportunidade/prova_social = **suggested**; nenhum **required** hoje
  (reservado p/ futuro tipo "oferta-especifica"). `offer` exposto em CONTENT_TYPE_OPTIONS.
- **premiumData.js**: `createContentPost` aceita oferta nula (`campaign_id: campaignId || null`); so bloqueia
  quando `contentTypeOffer(type)==='required'`. `loadPremiumWorkspace`: posts sem oferta escopam pela marca
  (`metadata.brand_scope`), nao mais descartados pelo filtro de campanha.
- **PremiumDashboard.jsx**: picker do topo vira **"Oferta vinculada (opcional)"** com opcao
  **"Sem oferta — conteudo de marca"** (estado '' explicito). Dica CONTEXTUAL por tipo (required bloqueia;
  suggested so sugere; none nada). O tracker vira **"Conteudos em producao"** (escopo de marca), com tag
  **Marca/<oferta>** por linha. Memo/refresh preservam o estado "sem oferta".

## Verificacao (ao vivo)
lint, 157 testes, build OK; `deno check` na edge generate-content OK. No preview (Conteúdo Imobiliária):
- Picker mostra "Sem oferta — conteudo de marca" + as 6 ofertas.
- Tipo "Post de imovel" (suggested) sem oferta -> dica suave, salvar NAO bloqueia. Tipo "institucional"
  (none) -> sem dica.
- **E2E**: gerou via IA + salvou um post institucional **sem oferta** -> DB gravou `campaign_id=null`,
  `brand_scope=vitra_imobiliaria`, `content_type=institucional`; board "Conteudos em producao (37)" mostrou
  o novo post com tag **MARCA** (demais com tag da oferta). Zero erro no console. Post de teste removido
  via service-role (delete anon e no-op por RLS).

## Recomendacao registrada
"Oferta vinculada" e **CONTEXTUAL**: opcional por padrao, exigida so para tipos que falam de oferta/imovel
especifico (today: nenhum exige; imovel/oportunidade sugerem). Ver [[conteudo-organico]].
