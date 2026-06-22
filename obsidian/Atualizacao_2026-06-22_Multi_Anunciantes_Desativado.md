# Atualizacao 2026-06-22 — "Anúncios com vários anunciantes" desmarcado por padrão

> Todo novo anúncio do Tráfego Pago sobe com multi-advertiser OFF. Na `main`. Commit: **e2bb56e**.

## O que foi feito
- **build_draft:** todo conjunto novo é criado com `is_multi_advertiser_ads_enabled: false`. Não altera
  anúncios existentes (só vale para builds novos).
- **Fallback resiliente:** loop de criação do conjunto (máx. 3 tentativas) que retira o parâmetro
  problemático e tenta de novo — cobre tanto o campo multi-advertiser sem suporte no objetivo quanto os
  interesses depreciados. Nunca falha o build por causa do campo; registra aviso em `targeting_adjustments`
  e devolve `multi_advertiser_off` / `multi_advertiser_note` por conjunto.
- **read_campaign_config:** passa a ler `is_multi_advertiser_ads_enabled` (status/validação).
- **UI (PublishMetaPanel):** linha de status fixa no bloco "Plataformas e posicionamentos":
  *"Anúncios com vários anunciantes: Desativado — enviado à Meta em todo anúncio novo (não altera
  anúncios existentes)."*

## Validação da disponibilidade na API (honesta)
- O **write da Graph aceitou** `is_multi_advertiser_ads_enabled: false` no build de leads_form **sem erro**
  (a Graph rejeita parâmetro desconhecido com 400 — comprovado nos interesses depreciados). Logo, o campo é
  controlável na escrita e o opt-out é enviado.
- O **read** devolve `null` para o estado desativado/não-aplicável (a Meta não ecoa o `false`). Por isso a
  fonte de verdade do status é **o que enviamos** (`multi_advertiser_off`), exibido na UI; se algum objetivo
  recusar o campo, o fallback remove e mostra o aviso.
- O catálogo do MCP de insights não lista o campo (é read-only de métricas) — não é a autoridade da escrita.

## Verificação
deno check + lint + **162 testes** + build OK; deploy CLI. Build PAUSED de teste criado (multi_off=true, sem
aviso) e **apagado** após validar. Status conferido ao vivo na UI.

Ver [[Atualizacao_2026-06-22_Posicionamentos_UI_e_Default]].
