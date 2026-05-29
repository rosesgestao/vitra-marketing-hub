# Arquitetura Operacional Desejada

## Decisao Arquitetural Base

A experiencia do dashboard Premium deve migrar para o app React existente em `dashboard/`, usando Supabase como banco e storage.

O HTML atual deve servir como referencia de produto, UI e regras de geracao, nao como base final de producao.

## Camadas

### Front-end

- App React em `dashboard/`.
- Nova area `Vitra Premium` ou `Campanhas Premium`.
- Interface de criacao de campanha.
- Lista de campanhas.
- Grade de assets.
- Editor de copy/visual.
- Aprovacao e revisao.
- Visao de metricas por campanha e por publicacao.

### Backend / Jobs

- API Node ou Supabase Functions para receber campanha e gerar assets.
- Jobs para renderizacao de PNG/HTML.
- Integracao com Supabase Storage.
- Jobs de coleta de metricas via Meta API.
- Possivel integracao com o Ag.8 Publicador.

### Banco de Dados

Tabelas sugeridas:

- `premium_campaigns`
- `premium_campaign_assets`
- `premium_content_posts`
- `premium_publications`
- `premium_metrics`
- `premium_generation_jobs`
- `social_accounts`
- `social_metric_snapshots`

## Integracoes Necessarias

### Supabase

- Persistencia de campanhas e assets.
- Storage dos criativos finais.
- Relacionamento entre campanha, asset, publicacao e metrica.

### Meta / Instagram / Facebook

- Importar ou registrar publicacoes.
- Coletar metricas por post.
- Coletar dados agregados das contas.
- Opcionalmente publicar via API oficial quando o asset estiver aprovado.

### Pipeline de Agentes

- Reaproveitar `src/agents/agent8-publicador.js` para publicacao.
- Corrigir e expandir coleta de metricas em `src/agents/agent1-orquestrador.js`.
- Integrar geracao visual com `src/integrations/card-builder.js` ou renderer dedicado Premium.

## Principio de Seguranca

Tokens e credenciais nunca devem ficar no front-end. Qualquer chamada a Meta, Supabase service role, renderizacao ou publicacao deve passar por backend/job controlado.
