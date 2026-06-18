# Atualizacao 2026-06-18 — Conteúdo: simplifica a seção orgânica (separa do chrome pago)

> A seção Conteúdo reusa o `PremiumDashboard` (mesmo componente do Tráfego Pago) e herdava "roupa de
> campanha", dando sensação de complexidade e de que conteúdo pertence a uma oferta. Na `main`.
> Commit: **bb269c6**.

## Diagnostico (PO + dev senior)
O NÚCLEO de criação ("Gerar posts | Criar do zero | Importar plano" → funil) ja estava enxuto. O ruido
vinha do enquadramento PAGO em volta: (1) "Oferta vinculada" defaultava para a 1a oferta (TOM MENINO
DEUS) — parecia obrigatoria; (2) KPIs do topo eram pagos (Campanhas/Assets/Investimento R$/leads); (3)
aba "Modelo" (modelo de dados) e botao "Nova oferta" — conceitos de campanha/tecnicos.

## Entregue (itens 1-3 — escolha do Leonardo)
- **Orgânico-first por padrao:** `selectedCampaignId` inicial no modo Conteúdo passa a ser `''` ("Sem
  oferta — conteudo de marca"); o Tráfego Pago segue iniciando na 1a campanha. (Antes ambos caiam para
  `campaigns[0]`.)
- **KPIs ORGANICOS no header:** `contentStats` (memo sobre `scoped.posts`) →
  **Conteúdos · Rascunhos (em produção) · Agendados · Publicados**, no lugar de
  Campanhas/Assets/Investimento/leads (que vivem no Tráfego Pago e em Métricas).
- **Removidos do orgânico:** aba **"Modelo"** (TABS + branch DataModelSection) e botao **"Nova oferta"**
  do header (criar oferta e acao de campanha — fica no Tráfego Pago). Sobrou só **"Novo conteúdo"**.

So UI no modo Conteúdo; nenhuma logica de tela alterada e o Tráfego Pago intacto.

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview (server reiniciado limpo): header com **Conteúdos 40 / Rascunhos
36 / Agendados 4 / Publicados 0**; "Oferta vinculada" em **"Sem oferta — conteúdo de marca"**; abas
**Produção · Publicações · Configurações** (sem Modelo); header só com **"Novo conteúdo"**. **Console sem
erros** (os erros vistos antes eram artefatos de HMR de um estado intermediario das edicoes — lint
no-undef passou e o dashboard renderiza inteiro).

## Resta (1, entrega dedicada) + follow-ups
- **Publicação NATIVA via Graph** (IG/FB orgânico) — IG Business + `instagram_content_publish` + token de
  Página server-side + container/publish; pré-requisitos no Meta a alinhar.
- Refator opcional (item 4 da analise): tirar o seletor global de oferta do topo e torná-lo vínculo
  contextual DENTRO do card de criação.

Continuacao de [[Atualizacao_2026-06-18_Conteudo_Biblioteca_DAM]]. Ver [[conteudo-organico]].
