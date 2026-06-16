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

## DESTRAVADO (commit e5f6554)
As Configuracoes da Pagina Vitra Imobiliaria mostram WhatsApp conectado: "Usar WhatsApp como botao de
acao" ligado + numeros **+55 51 8225-0218 (principal)**, 9017-5037, 8331-1573, 8279-0239. Ou seja, o
pre-requisito ESTAVA atendido — o `page_status` deu **falso negativo** (token nao le esse estado de
forma confiavel; o que vale e a config da Pagina). Virei `whatsapp.available=true`. Com
`promoted_object:{page_id}` a Meta usa o numero PRINCIPAL e valida a conexao no build. Verificado: o
objetivo passa do gate de disponibilidade (cai em `no_approved_creative`, como qualquer objetivo sem
criativo aprovado).

## Resta
Aprovar 1 criativo (gate comum a todos os objetivos) para um build real de Conversas. A forma de
pagamento do WABA (aviso no Gerenciador do WhatsApp) ajuda a nao limitar conversas. Ver
[[meta-ads-publicacao]].
