# Roadmap de Desenvolvimento

## Fase 1 - Fundacao

- Definir schema Supabase para campanhas Premium.
- Criar migracao SQL.
- Criar tipos/status oficiais de campanha e asset.
- Mapear campos do modal `Nova Campanha` para o banco.
- Definir quais assets sao gerados por padrao.

## Fase 2 - Interface React

- Criar area Premium no dashboard React.
- Implementar lista de campanhas.
- Implementar formulario `Nova Campanha`.
- Implementar grade de assets.
- Implementar editor basico de asset.
- Substituir `localStorage` por Supabase.

## Fase 3 - Geracao e Renderizacao

- Mover geracao de assets para backend/job.
- Criar renderer de cards Premium com Playfair Display + Inter.
- Gerar PNGs em alta qualidade.
- Salvar em Supabase Storage.
- Registrar URLs e metadados no banco.

## Fase 4 - Publicacao e Registro

- Definir se a publicacao sera automatica, manual ou hibrida.
- Integrar assets aprovados com `publicacoes`.
- Registrar `post_id_externo` e permalink.
- Criar fluxo para importar posts publicados manualmente.

## Fase 5 - Metricas

- Corrigir schema e coletor de metricas.
- Coletar metricas por publicacao real.
- Separar metricas organicas e pagas.
- Criar visao por campanha, asset, formato e canal.
- Registrar insights e plano de acao.

## Fase 6 - Aprendizado

- Identificar melhores headlines, CTAs, formatos e fases.
- Criar relatorio por campanha.
- Alimentar proximas geracoes com historico de performance.

## Primeiro Marco Recomendado

Criar a fundacao Supabase + primeira tela React de campanhas, sem ainda publicar nem coletar metricas. O objetivo inicial e substituir o `localStorage` por uma base operacional confiavel.

## Status em 2026-05-29

Primeiro marco iniciado e aplicado:

- Dashboard React agora possui a area `Premium`.
- Modelo Supabase Premium foi criado e aplicado no projeto `birxcfkyuzqnhyvetbjv`.
- A tela ja le campanhas, assets, publicacoes, metricas, jobs e contas sociais.
- O fluxo `Nova campanha` ja cria campanha, matriz inicial de assets, conteudos planejados e jobs de proxima etapa.

Proximo marco: transformar os jobs planejados em execucao backend real com renderizacao via `card-builder.js` e Supabase Storage.

## Prioridade Oficial

Conforme [[06 - Escopo Oficial do Projeto]], a ordem de execucao definida para o projeto e:

1. Migrar o dashboard Premium para React + Supabase.
2. Criar tabelas de campanha, assets, publicacoes e metricas.
3. Mover geracao e renderizacao para backend com Supabase Storage.
4. Implementar integracao Meta para importar publicacoes e metricas por post.
