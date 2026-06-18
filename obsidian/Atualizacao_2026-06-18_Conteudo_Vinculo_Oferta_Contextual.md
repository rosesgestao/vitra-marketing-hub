# Atualizacao 2026-06-18 — Conteúdo: vínculo de oferta CONTEXTUAL no card (item 4)

> Fecha o item 4 da analise de simplificacao: a oferta deixa de ser um seletor GLOBAL no topo do organico
> e vira vinculo CONTEXTUAL dentro do card "Novo conteúdo". A secao opera em visao de MARCA. Na `main`.
> Commit: **5ac7f79**.

## Entregue
- **Removido o seletor global "Oferta vinculada" do topo** do organico. `selectedCampaign` fica null no
  modo Conteúdo -> `scoped` brand-wide: KPIs, funil "Conteúdos em produção" e a aba Publicações passam a
  refletir TODA a marca (varios offers juntos), nao mais uma oferta em foco.
- **Vinculo CONTEXTUAL no card** (`ContentProductionSection`): estado interno `linkedCampaignId` (default
  `''` = "Sem oferta — conteúdo de marca"); picker **"Vincular a uma oferta (opcional)"** dentro do card.
  `createContentPost` (IA + manual) e `importContentPlan` usam o vinculo LOCAL; as dicas de oferta
  (required/suggested por tipo) apontam para esse campo.
- **`PublicationsSection`** nao exige mais campanha global: herda a oferta (ou marca) do CONTEUDO
  selecionado (`campaign_id`/`brand_scope` do post) — coerente com publicacao de marca (sem oferta).

So UI no modo Conteúdo; Tráfego Pago intacto (la a oferta/campanha continua sendo selecionada).

## Verificacao (ao vivo)
lint, 157 testes, build OK. Server REINICIADO limpo (sem intermediarios de HMR) -> **console sem erros**.
No preview: topo sem o seletor; **"Vincular a uma oferta"** dentro do card (Sem oferta no topo); salvei um
rascunho manual vinculando "TOM MENINO DEUS" -> o post nasceu com aquela `campaign_id` (confirmado no
banco); funil **brand-wide (40)** com tags MARCA + oferta misturadas. Post de teste removido.

NOTA: erros de console vistos durante a edicao eram estados INTERMEDIARIOS do HMR (ao trocar a assinatura
removendo `campaign` antes de substituir todos os usos) — sumiram no build limpo; o lint no-undef pegou o
ultimo uso residual (linha do import de plano), corrigido.

## Resta (1, entrega dedicada)
- **Publicação NATIVA via Graph** (IG/FB orgânico) — IG Business + `instagram_content_publish` + token de
  Página server-side + container/publish; pré-requisitos no Meta a alinhar. A `art_url`/biblioteca já
  serve de mídia. Continuacao de [[Atualizacao_2026-06-18_Conteudo_Simplifica_Organico]].
  Ver [[conteudo-organico]].
