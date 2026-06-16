# Atualizacao 2026-06-16 — Meta: objetivo Conversas (WhatsApp)

> Mais uma linha do playbook: **Conversas (WhatsApp)** / click-to-WhatsApp. Entra **bloqueada (🔒)** ate
> a Pagina ter um numero de WhatsApp Business conectado — no padrao do leads_form antes do ToS. Na
> `main`. Commit: **20769fe**.

## Verificacao do pre-requisito (feita antes)
Estendi o `page_status` (manage-audiences) para ler WhatsApp conectado (best-effort: `whatsapp_number`/
`connected_whatsapp`; o campo nao e exposto de forma confiavel a token de system user). Resultado: Pagina
**Vitra Imobiliaria** `1509497485962089` -> `whatsapp_connected:false`. As outras Paginas o token nem le
(#10). Logo, hoje nenhum numero confirmado -> objetivo nasce `available:false`.

## Entregue
- **Playbook** `whatsapp`: `OUTCOME_ENGAGEMENT` / `optimization_goal CONVERSATIONS` / `destination_type
  WHATSAPP` / `cta WHATSAPP_MESSAGE`, `needs:['whatsapp']`, `available:false`, hint "conecte um numero de
  WhatsApp Business a Pagina".
- **build_draft**: `isWhatsApp` aplica `promoted_object:{page_id}` (como no lead form); o criativo usa CTA
  WHATSAPP_MESSAGE com link wa.me (campo Destino). Caminho pronto: ao destravar, funciona sem mais codigo.
- **Front**: a pilula aparece sozinha (re-export do playbook), em 🔒 com o hint.

## Diferenca do que ja existia
"Leads (clique)" com destino `wa.me/...` ja manda pro WhatsApp por LINK (LINK_CLICKS) — funciona, mas e
clique pro app. "Conversas (WhatsApp)" e o formato NATIVO, otimizado por conversa iniciada (CONVERSATIONS).

## Nota sobre o guard
Diferente do ToS (campo `leadgen_tos_accepted` confiavel -> validacao em runtime), o estado de WhatsApp
conectado NAO e lido de forma confiavel pelo nosso token. Por isso o guard hoje e o flag do playbook
(`available:false`); ao conectar o numero, viramos `available:true` e a propria Meta valida a conexao na
criacao do conjunto (erro gracioso se faltar).

## Resta
Conectar um numero de WhatsApp Business a Pagina (Meta Business Suite > WhatsApp) e entao virar
`whatsapp.available=true`. Ver [[meta-ads-publicacao]]. Continuacao de
[[Atualizacao_2026-06-15_Meta_Guards_Marca_e_Aprovacao]].
