# Atualizacao 2026-06-16 — Auto-descoberta de contas e Paginas da Meta

> O painel "Publicar na Meta" deixou de pedir IDs digitados: agora lista as contas de anuncio e Paginas
> REAIS que o token acessa, e o operador so seleciona. Na `main`. Commit: **652f795**.

## Por que
Digitar ad_account_id / page_id e atrito e fonte de erro (ID errado, marca trocada). A integracao ja
permite descobrir os ativos autorizados pelo token de system user.

## Entregue
- **manage-audiences** (2 acoes read-only):
  - `list_ad_accounts` -> `GET /me/adaccounts` (id, name, currency, active).
  - `list_pages` -> `GET act_{id}/promote_pages` (Paginas promoveis na conta = ativos atribuidos).
- **premiumData**: `listMetaAdAccounts()` / `listMetaPages(adAccountId)`.
- **PublishMetaPanel**: ao abrir, carrega as contas e **pre-seleciona a da marca** (META_AD_ACCOUNTS);
  ao escolher a conta, carrega as Paginas dela e seleciona a primeira valida. Os campos viram **selects**;
  se a descoberta vier vazia (sem token/permissao), caem em **input manual** (fallback).

## Verificacao (ao vivo)
- Contas: **Vitra Porto Alegre** `122035585232240`, **Vitra RH** `237289927428029`, **Vitra Premium**
  `1057868298461356` (todas BRL, ativas).
- Paginas (ambas as contas): **Vitra Imobiliaria** `1509497485962089` — confirma que a Pagina Premium
  ainda NAO esta atribuida ao system user (a lista reflete a estrutura real).
- deno check, lint, 151 testes, build OK; chain cliente->edge->Meta validada no preview.

## Implicacao
Para Premium publicar (Leads-form/WhatsApp/Conversas com Pagina propria), falta **atribuir a Pagina
Premium ao system user** — enquanto isso, a lista de Paginas da conta Premium so traz a Imobiliaria, e o
guard de marca bloquearia o cruzamento. Ver [[meta-ads-publicacao]].
