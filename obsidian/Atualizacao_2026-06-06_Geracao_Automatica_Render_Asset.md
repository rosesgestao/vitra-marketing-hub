# Atualizacao 2026-06-06 - Geracao Automatica Render Asset

## Contexto

Esta nota registra as alteracoes feitas depois da atualizacao sobre `Variacoes por Template Aprovado`, com foco no fluxo de Trafego Pago da Vitra Imobiliaria.

Durante os testes no dashboard local, a criacao de campanhas passava a montar assets e vincular fotos, mas alguns cortes permaneciam em `queued` ou exigiam clique manual em `Gerar cortes`.

## Problemas Identificados

- O navegador bloqueava chamadas para a Edge Function `render-asset` por CORS.
- O header `x-client-info`, enviado automaticamente pelo cliente Supabase no browser, nao estava permitido na resposta de preflight.
- Apos corrigir CORS, a funcao passou a responder ao navegador, mas houve retorno transitorio `546` da Edge Function.
- O processamento manual via Node conseguia renderizar o mesmo asset, indicando falha transitoria de invocacao remota, nao ausencia de imagem, payload invalido ou erro de autorizacao.

## Decisao Tecnica

O fluxo de cortes nao deve depender de intervencao manual quando a campanha ja possui fotos vinculadas.

A ferramenta deve:

- criar a campanha;
- vincular as imagens enviadas pelo usuario;
- identificar assets `queued` com imagem de origem;
- chamar `render-asset` automaticamente em segundo plano;
- processar assets em lotes unitarios para reduzir risco de limite de memoria/runtime;
- fazer retry curto apenas para falhas transitorias da Edge Function.

## O Que Foi Atualizado

- `supabase/functions/render-asset/index.ts`
  - CORS atualizado para permitir `authorization`, `x-client-info`, `apikey` e `content-type`.
  - Metodos permitidos: `POST` e `OPTIONS`.

- `dashboard/src/lib/premiumData.js`
  - Renderizacao passa a consultar explicitamente assets pendentes com `asset_ids`.
  - Chamada para `render-asset` passa a usar lotes pequenos.
  - Adicionado retry controlado para erros transitorios `546`, `502`, `503`, `504` e `failed to fetch`.
  - A mensagem de erro de renderizacao ficou mais explicita para diagnostico operacional.

- `dashboard/src/views/PremiumDashboard.jsx`
  - Fluxo automatico em segundo plano preservado para campanhas de Trafego Pago.
  - Atualizacao silenciosa da workspace durante progresso de renderizacao.
  - Protecao contra execucoes duplicadas do auto-render na mesma campanha.

## Validacoes Executadas

- `deno check supabase/functions/render-asset/index.ts`: aprovado.
- Deploy remoto de `render-asset` no projeto Supabase ativo `birxcfkyuzqnhyvetbjv`: concluido.
- Teste remoto de preflight `OPTIONS`: aprovado, incluindo `x-client-info` em `access-control-allow-headers`.
- Reproducao de POST para asset pendente com imagem vinculada: retornou `200 OK` e gerou PNG no bucket `cards`.
- Consulta posterior confirmou `0` assets `queued` com `source_image_url` no momento do teste.
- `npm.cmd run build`: aprovado, com aviso normal de tamanho de bundle do Vite.
- `git diff --check`: aprovado, apenas avisos esperados de CRLF no Windows.

## GitHub

- Commit publicado: `65fe9a5 - Corrige geracao automatica de criativos`.
- Branch: `main`.
- Repositorio: `leoferrazbrasil/vitra-premium-ferramenta-operacional`.

## Resultado Operacional

O dashboard agora esta preparado para iniciar a geracao dos cortes automaticamente apos a criacao da campanha, sem exigir clique manual, desde que as imagens estejam vinculadas aos assets.

Caso a Edge Function oscile no primeiro disparo, o frontend tenta novamente antes de considerar o corte como falho.

## Observacoes

- O erro `546` foi tratado como falha transitoria de invocacao remota.
- Se uma campanha antiga permanecer com cortes pendentes, o botao `Gerar cortes` continua valido como acao manual de retomada.
- Para campanhas novas, o comportamento esperado e o auto-render em segundo plano apos o modal `Nova Campanha`.
