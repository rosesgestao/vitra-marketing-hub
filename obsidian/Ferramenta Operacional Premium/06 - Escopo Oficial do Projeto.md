# Escopo Oficial do Projeto

## Declaracao de Escopo

O escopo da ferramenta operacional Vitra Premium e transformar o prototipo local `planejamento_vitra_premium/dashboard-conteudo.html` em um sistema real para criacao, organizacao, aprovacao, renderizacao, publicacao/importacao e medicao de conteudos e campanhas da Vitra Premium.

O objetivo principal e sair de um HTML local baseado em `localStorage` para um sistema conectado com banco de dados, storage, geracao server-side e metricas por publicacao real.

## Componentes do Escopo

### 1. Transformar o dashboard em app real

O HTML atual deve virar uma tela/modulo dentro do dashboard React existente em `dashboard/src/App.jsx`, aproveitando Vite, React e Supabase.

Motivo: manter o projeto como HTML monolitico dificulta integracao, autenticacao, metricas, manutencao e evolucao.

### 2. Criar modelo de dados Premium no Supabase

O dashboard atual salva campanhas em `localStorage`, usando chaves como `vitra-campaigns` e `vitra-camp-<id>`.

O sistema operacional deve usar tabelas dedicadas, incluindo:

- `premium_campaigns`
- `premium_campaign_assets`
- `premium_content_posts`
- `premium_publications`
- `premium_metrics`
- `premium_generation_jobs`
- `social_accounts`
- `social_metric_snapshots`

### 3. Migrar a geracao de campanha para backend

O modal `Nova Campanha` deve enviar os dados para uma API Node ou Supabase Function.

O backend deve:

- gerar os assets;
- aplicar regras de marca;
- salvar campanhas e assets no banco;
- disparar jobs de criacao visual;
- proteger tokens e logica critica.

O navegador nao deve carregar regras criticas nem credenciais.

### 4. Substituir exportacao local por pipeline de assets

Hoje a exportacao usa `html2canvas` via CDN e salva PNG localmente.

O sistema final deve:

- renderizar assets no backend com Puppeteer/card-builder;
- gerar PNG em alta qualidade;
- subir os arquivos para Supabase Storage;
- salvar URL publica e metadados no asset.

### 5. Conectar metricas reais

A aba `Metricas` do HTML atual e manual/local.

Para funcionar, cada publicacao precisa registrar:

- plataforma;
- campanha;
- asset/conteudo de origem;
- `post_id_externo`;
- permalink;
- data/hora de publicacao;
- metricas por coleta.

### 6. Corrigir incompatibilidade no schema de metricas

O schema atual em `supabase/schema.sql` define campos como `likes`, `visualizacoes_video` e `novos_seguidores`.

O coletor atual tenta inserir campos como `seguidores`, `curtidas` e `visualizacoes`.

Essa incompatibilidade precisa ser corrigida antes da integracao operacional.

### 7. Diferenciar metricas organicas e pagas

Como a campanha gera assets de Meta Ads, as metricas precisam separar:

- posts organicos;
- anuncios pagos;
- dados de conta;
- dados por asset/publicacao.

Para anuncios pagos, sera necessario considerar Meta Marketing API/Ads Insights:

- `campaign_id`;
- `adset_id`;
- `ad_id`;
- gasto;
- impressoes;
- cliques;
- leads;
- CPL;
- conversoes.

### 8. Fechar o ciclo publicacao -> metricas

O sistema precisa vincular conteudo planejado, asset aprovado, publicacao real e metricas coletadas.

Opcoes operacionais:

- publicacao automatica pelo proprio sistema, usando o Ag.8 Publicador;
- publicacao manual com importacao/mapeamento do post publicado pela API;
- modelo hibrido.

Sem esse vinculo, a aba `Metricas` nao sabe qual post real corresponde a qual conteudo planejado.

## Prioridade Recomendada

1. Migrar o dashboard Premium para React + Supabase.
2. Criar tabelas de campanha/assets/publicacoes/metricas.
3. Mover geracao e renderizacao para backend com Supabase Storage.
4. Implementar integracao Meta para importar publicacoes e metricas por post.

## Fora do Escopo Inicial

- Publicacao automatica completa em todas as redes no primeiro marco.
- Automacao de anuncios pagos no Meta Ads Manager.
- Substituicao do pipeline geral de agentes da Vitra Imobiliaria.
- Mistura de Vitra Premium com a marca-mae sem validacao do Brand System.

## Criterio de Sucesso

A ferramenta sera considerada funcional quando uma campanha criada pelo modal `Nova Campanha` puder gerar assets persistidos em Supabase, renderizar criativos finais em storage, vincular publicacoes reais e exibir metricas por asset/publicacao.
