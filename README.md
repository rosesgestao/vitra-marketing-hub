# Vitra Premium - Ferramenta Operacional

Ferramenta operacional para campanhas, conteudos e metricas da Vitra Premium.

## Objetivo

Transformar o prototipo local `planejamento_vitra_premium/dashboard-conteudo.html` em um sistema real para criacao, organizacao, aprovacao, renderizacao, publicacao/importacao e medicao de conteudos e campanhas da Vitra Premium.

O ponto central do projeto e sair de um HTML local baseado em `localStorage` para um sistema conectado com banco, storage, geracao server-side e metricas por publicacao real.

## Escopo

1. Migrar o dashboard Premium para React + Supabase.
2. Criar tabelas de campanha, assets, publicacoes e metricas.
3. Mover geracao e renderizacao de assets para backend com Supabase Storage.
4. Implementar integracao Meta para importar publicacoes e metricas por post.

## Componentes Planejados

- `premium_campaigns`
- `premium_campaign_assets`
- `premium_content_posts`
- `premium_publications`
- `premium_metrics`
- `premium_generation_jobs`
- `social_accounts`
- `social_metric_snapshots`

## Fluxo Operacional Esperado

1. Criar campanha pelo modal `Nova Campanha`.
2. Gerar assets de campanha com regras Vitra Premium.
3. Revisar e aprovar copy/visual.
4. Renderizar criativos finais no backend.
5. Salvar arquivos no Supabase Storage.
6. Publicar pelo sistema ou importar publicacao manual.
7. Vincular publicacao real ao asset de origem.
8. Coletar metricas organicas e pagas.
9. Exibir desempenho por campanha, asset, canal e publicacao.

## Documentacao

- [Escopo oficial](docs/escopo-oficial.md)

## Regra de Marca

Este projeto pertence ao universo Vitra Premium. Nao deve misturar assets, linguagem, CTAs ou estrategia da marca-mae Vitra Imobiliaria sem validacao explicita do Brand System Vitra.
