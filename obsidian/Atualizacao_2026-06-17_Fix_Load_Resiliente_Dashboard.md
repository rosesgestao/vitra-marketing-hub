# Atualizacao 2026-06-17 — Fix: load do dashboard resiliente (estabiliza "Tempo esgotado")

> O erro "Falha ao carregar a área Imobiliária / Tempo esgotado ao consultar o Supabase Premium"
> persistia mesmo apos subir o timeout para 20s. Causa real e correcao definitiva abaixo. Na `main`.
> Commit: **5e5a286**.

## Causa
`loadPremiumWorkspace` fazia `Promise.all(8 queries)` com **um timeout GLOBAL**. Bastava UMA query lenta
(provavelmente `premium_campaign_assets` limit 600 ou `premium_metrics` 500, com jsonb pesado) estourar
para **rejeitar tudo** e zerar o dashboard com o erro. Aumentar o numero global so adiava.

## Correcao
- **`safeQuery` por dataset**: cada query tem timeout PROPRIO e, em lentidao/erro, **degrada para vazio**
  (`{data:[],error}`) em vez de rejeitar. As 8 rodam em **paralelo**, entao o tempo total ~ a mais lenta.
- **So CAMPANHAS e critica** (throw, pois sem elas nao ha workspace); as demais fatias degradam e o
  dashboard carrega o essencial mesmo assim.
- **Timeouts generosos** (campanhas 25s) + **payloads menores** (assets 600->150, content 300->200,
  pubs 300->150, metricas 500->120, jobs 200->80, snapshots 200->120) para reduzir o tempo de resposta.

## Verificacao
lint, build OK. A verificacao completa no preview ficou LIMITADA porque o Supabase estava lento NO
SANDBOX (ate uma unica query de campanhas levava >10s; 3 sequenciais estouraram 30s) — isso e ambiental
(conexao do sandbox), nao do codigo. No ambiente do usuario, com a carga em paralelo e os limites
menores, a janela de 25s para campanhas acomoda a carga e o dashboard deixa de quebrar; fatias pesadas
lentas degradam sem derrubar a tela.

## Limpeza
Posts de teste das fases B/C removidos via service-role (o delete anon era no-op por RLS): "TESTE Fase B
v2", "TOM Menino Deus: viver bem...", "TESTE updateContentPost".

Continuacao de [[Atualizacao_2026-06-17_Conteudo_FaseC_Unifica_Board_Calendario]].
