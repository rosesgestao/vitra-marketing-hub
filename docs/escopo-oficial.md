# Escopo Oficial do Projeto

## Declaracao de Escopo

O escopo da ferramenta operacional Vitra Premium e transformar o prototipo local `planejamento_vitra_premium/dashboard-conteudo.html` em um sistema real para criacao, organizacao, aprovacao, renderizacao, publicacao/importacao e medicao de conteudos e campanhas da Vitra Premium.

O objetivo principal e sair de um HTML local baseado em `localStorage` para um sistema conectado com banco de dados, storage, geracao server-side e metricas por publicacao real.

## O Que Falta Para Ficar Funcional

### 1. Transformar o dashboard em app real

O HTML atual deve virar uma tela/modulo dentro de um dashboard React com Vite, React e Supabase.

Manter tudo em um HTML monolitico dificulta integracao, autenticacao, metricas e manutencao.

### 2. Criar modelo de dados Premium no Supabase

O dashboard atual salva campanhas em `localStorage`, usando chaves como `vitra-campaigns` e `vitra-camp-<id>`.

O sistema operacional deve usar tabelas dedicadas:

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

O backend deve gerar os assets, aplicar regras de marca, salvar no banco e disparar jobs de criacao visual. O browser nao deve carregar logica critica nem tokens.

### 4. Substituir exportacao local por pipeline de assets

A exportacao atual usa `html2canvas` via CDN e salva PNG localmente.

Para producao, a renderizacao deve ocorrer no backend com Puppeteer/card-builder, gerar PNG em alta qualidade, subir para Supabase Storage e salvar a URL publica no asset.

### 5. Conectar metricas reais

A aba `Metricas` do HTML atual e manual/local.

Cada publicacao precisa registrar:

- plataforma;
- campanha;
- asset/conteudo de origem;
- `post_id_externo`;
- permalink;
- data/hora de publicacao;
- metricas por coleta.

### 6. Schema de metricas (RECONCILIADO em 2026-06-06 — sem pendencia)

A revisao do codigo versionado mostra que NAO existe a incompatibilidade descrita anteriormente. A tabela `premium_metrics` define `likes`, `video_views` e `follows`, e o registro manual (`createManualMetric` em `dashboard/src/lib/premiumData.js`) insere exatamente esses mesmos campos. Os termos em portugues (`curtidas`, `seguidores`, `visualizacoes`) aparecem apenas como rotulos de interface, nao como colunas, e nenhum coletor com nomes divergentes existe no repositorio.

Conclusao: este item permanece apenas como registro historico. Nao ha correcao de schema pendente aqui.

### 7. Diferenciar metricas organicas e pagas

Como a campanha gera assets de Meta Ads, somente Instagram/Facebook Insights nao basta.

Para anuncios pagos, sera necessario usar Meta Marketing API/Ads Insights com:

- `campaign_id`;
- `adset_id`;
- `ad_id`;
- gasto;
- impressoes;
- cliques;
- leads;
- CPL;
- conversoes.

Para posts organicos, usar metricas por media/post.

### 8. Fechar o ciclo publicacao -> metricas

O sistema precisa vincular conteudo planejado, asset aprovado, publicacao real e metricas coletadas.

Opcoes:

- publicacao pelo proprio sistema, usando o Ag.8 Publicador;
- publicacao manual com importacao/mapeamento do post publicado pela API;
- modelo hibrido.

Sem esse vinculo, a aba `Metricas` nao sabe qual post real corresponde a qual conteudo planejado.

## Prioridade Recomendada

1. Migrar o dashboard Premium para React + Supabase.
2. Criar tabelas de campanha/assets/publicacoes/metricas.
3. Mover geracao e renderizacao para backend com Supabase Storage.
4. Implementar integracao Meta para importar publicacoes e metricas por post.

## Criterio de Sucesso

A ferramenta sera considerada funcional quando uma campanha criada pelo modal `Nova Campanha` puder gerar assets persistidos em Supabase, renderizar criativos finais em storage, vincular publicacoes reais e exibir metricas por asset/publicacao.
