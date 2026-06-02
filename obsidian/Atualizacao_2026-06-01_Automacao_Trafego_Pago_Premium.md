# Atualizacao 2026-06-01 - Automacao de Trafego Pago Premium

## Objetivo

Reduzir a dependencia de execucao manual na criacao de criativos de campanhas de trafego pago da Vitra Premium, mantendo controle humano nos pontos de risco: confirmacao do brief, aprovacao criativa e autorizacao de verba/publicacao.

## O Que Foi Aplicado

- O modal `Nova Campanha` passou a aceitar a origem do material: Google Drive, site, pasta local/rede, PDF comercial, landing page ou brief manual.
- Foram adicionados campos para link/caminho da fonte, landing page, WhatsApp de atendimento e observacoes para automacao.
- A criacao da campanha agora grava `source_intake` e `automation_workflow` em `premium_campaigns.brief`.
- Os assets de Meta Ads agora nascem com metadados de QA, origem, etapa de automacao e campos iniciais do Gerenciador da Meta.
- A tela de campanhas mostra uma esteira operacional com progresso por etapa.
- A tela de Trafego Pago ganhou QA por anuncio e exportacao de pacote JSON para subida/manual draft no Meta Ads.
- A sidebar ganhou o menu proprio `Trafego Pago`, mantendo a aba contextual dentro de `Premium`.
- O menu dedicado exibe um seletor de campanha, a esteira de automacao da campanha selecionada e a area de criativos Meta Ads.
- Foi criada a Edge Function `ingest-source-images` para tentar extrair fotos publicas do imovel a partir de links de site, imagens diretas e previews publicos do Google Drive.
- Novas campanhas passam a gravar fotos selecionadas automaticamente em `brief.images.auto` e distribuir essas imagens nos assets de Meta Ads via `source_image_url`.
- Campanhas antigas sem foto vinculada passam por tentativa de ingestao ao clicar em `Gerar cortes`; quando imagens sao encontradas, os assets nao aprovados sao reenfileirados para renderizar novamente com foto.
- O QA dos anuncios Meta agora exige `Foto do imovel`, evitando aprovacao/exportacao de criativos somente tipograficos quando a campanha tem origem visual esperada.
- Como a Edge Function de ingestao ainda nao estava publicada no Supabase, foi adicionado fallback local no Vite em `/api/ingest-source-images`.
- O fallback local aceita paginas publicas e pastas locais dentro de `D:\LEONARDO`, converte fotos `.HEIC` para JPEG, otimiza para ate 1600px e envia para o bucket `cards`.
- A renderizacao foi ajustada para lote unitario para evitar `WORKER_RESOURCE_LIMIT` com fundos fotograficos.
- A campanha `Louvre Gallerie 4` foi corrigida: 9 imagens reais foram vinculadas aos assets de Meta Ads e 9 criativos foram renderizados com foto do imovel.

## Politica Operacional

- A ferramenta pode gerar e preparar criativos automaticamente.
- A ferramenta nao deve publicar nem ativar verba de anuncio sem autorizacao humana.
- O pacote exportado serve como ponte segura entre criacao automatizada e operacao de midia paga.
- A integracao futura com Google Drive, crawler de site ou Meta Ads API deve ficar no backend, sem tokens no browser.
- Pastas privadas do Google Drive continuam exigindo uma integracao futura com Drive API; a ingestao atual funciona com fontes publicas ou previews publicos.

## Validacao

- `npm.cmd run build` executado em `dashboard/` com sucesso.
- `git diff --check` executado sem erros bloqueantes.
- Teste local do endpoint `/api/ingest-source-images` executado com link do imovel e pasta local HEIC.
- Inspecao visual confirmou criativo renderizado com foto real do imovel como fundo.
