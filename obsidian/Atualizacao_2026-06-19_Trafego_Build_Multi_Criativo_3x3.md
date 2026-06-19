# Atualizacao 2026-06-19 — Tráfego: build_draft multi-criativo (3×3 por conjunto)

> Fecha o ajuste anotado no E2E: o build deixa de criar 1 anuncio por conjunto e passa a criar **N
> anuncios (1 por criativo aprovado)** — espelhando a estrutura "3×3" da vencedora. Na `main`. Commit: **1d9a8be**.

## O que mudou (publish-meta-ads/build_draft)
- **`feedsFor(spec)`**: monta a LISTA de criativos do conjunto (do `ad_group` se houver `group_key`,
  senao todos os aprovados), **prefere 1:1**, dedup por id, **cap em N** (`creatives_per_adset`, default 3).
- Loop reescrito: **pre-valida a copy** de cada criativo (copyValidation); so cria o conjunto se houver
  **≥1 criativo valido**; cria o **adset 1x** e itera **criativo → adcreative → ad → publication** por criativo.
- Removido o `feedOf` (morto). Resposta agora inclui **`ads` (total)** e **`ad_ids` por conjunto**.
- Continua TUDO **PAUSED**; ativacao segue separada com confirm.

## Verificacao (ao vivo)
deno check + deploy OK. Build na campanha de teste Azenha `fe266337` (3 criativos aprovados) →
**2 conjuntos × 3 anuncios = 6 ads** (meta `120252934350130221`); resposta trouxe `ads:6` e os 3 `ad_ids`
por conjunto. Rascunho antigo de 2 anuncios (`120252931593820221`) apagado via `delete_draft` (orfao).
Estado: 1 rascunho PAUSED com 6 anuncios; zero gasto.

## Notas / proximos
- N e configuravel por `creatives_per_adset` (default 3). O auto-seed do preset ainda nao expoe esse
  campo na UI — hoje usa o default 3; se quiser controlar pelo painel, e um seletor simples no PublishMetaPanel.
- Os 3 criativos compartilham a mesma imagem-base por enquanto (placeholders); com fotos reais cada anuncio
  ja sai com seu proprio criativo + copy.
- Forms leadgen orfaos seguem acumulando por build (limpeza periodica).

Ver [[Atualizacao_2026-06-19_Trafego_Campanha_Teste_Azenha_E2E_Completo]] e [[meta-ads-publicacao]].
