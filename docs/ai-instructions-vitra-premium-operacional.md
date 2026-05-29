# Instrucoes para IA - Ferramenta Operacional Vitra Premium

Este documento orienta qualquer IA ou agente de codigo que trabalhe na ferramenta operacional da Vitra Premium.

## Missao do Projeto

Transformar o prototipo `planejamento_vitra_premium/dashboard-conteudo.html` em uma ferramenta operacional real para:

- criar campanhas Vitra Premium;
- gerar e organizar assets de conteudo;
- aprovar copies e criativos;
- renderizar materiais finais com qualidade de producao;
- registrar ou publicar conteudos;
- importar metricas reais por publicacao;
- aprender com performance por campanha, asset, canal e formato.

O sistema deve sair de HTML local com `localStorage` para React + Supabase + Storage + jobs backend + integracoes oficiais.

## Repositorios e Ambientes

Repositorio base e vault historico:

- `leoferrazbrasil/vitra-agentes-marketing`
- branch principal: `master`
- workspace local: `D:\LEONARDO\Vitra\vitra-agentes-marketing`

Repositorio dedicado da ferramenta operacional:

- `leoferrazbrasil/vitra-premium-ferramenta-operacional`
- branch principal: `main`
- base dedicada para evolucao da ferramenta Premium.

Supabase oficial:

- conta: `souleonardobrasil`
- e-mail: `github@leonardobrasil.com.br`
- organizacao: `Vitra Imobiliaria`
- projeto: `Marketing Vitra Imobiliaria`
- project ref: `birxcfkyuzqnhyvetbjv`
- URL: `https://birxcfkyuzqnhyvetbjv.supabase.co`

Nunca criar outro projeto Supabase sem aprovacao explicita.

## Fontes de Verdade

Antes de implementar, leia as fontes abaixo quando a tarefa envolver escopo, marca, design, dados ou arquitetura.

### Escopo e Estado do Projeto

- `obsidian/Ferramenta Operacional Premium/00 - Indice.md`
- `obsidian/Ferramenta Operacional Premium/06 - Escopo Oficial do Projeto.md`
- `obsidian/Atualizacao_2026-05-29_Ferramenta_Operacional_Premium_Fase_1.md`
- `docs/ai-instructions-vitra-premium-operacional.md`

### Brandbook e Identidade Premium

- `docs/brand/vitra-premium-brandbook.html`
- `vitra_brand_assets/brandbook-premium.html`
- `obsidian/Atualizacao_2026-05-28_Logos_Premium_Aprovadas.md`
- `docs/brand/brand-architecture-vitra.md`

### Prototipo e Planejamento Premium

- `planejamento_vitra_premium/dashboard-conteudo.html`
- `planejamento_vitra_premium/README.md`
- `docs/brand/premium-planning-operational-map.md`

### Implementacao Atual

- `dashboard/src/views/PremiumDashboard.jsx`
- `dashboard/src/lib/premiumData.js`
- `dashboard/src/lib/supabase.js`
- `supabase/migration-premium-operational.sql`

## Regra de Marca Vitra Premium

Vitra Premium e a submarca de luxo/alto padrao da Vitra Imobiliaria.

Use sempre:

- direcao visual luxury/refined/editorial;
- preto profundo, charcoal e dourado;
- Playfair Display para headlines;
- Inter para UI, corpo, labels e CTAs;
- composicao assimetrica, sofisticada e com respiro;
- linguagem de curadoria, patrimonio, exclusividade e alto padrao.

Nunca:

- misturar visual da marca-mae Vitra Imobiliaria com Vitra Premium;
- usar azul como cor dominante em materiais Premium;
- usar gradientes roxos ou layouts SaaS genericos;
- usar triangulos decorativos baratos ou hacks visuais;
- alterar logo, proporcao, cores, bordas ou descriptor;
- tratar arquivos de `planejamento_vitra_premium/` como producao aprovada.

Para Vitra Premium, usar apenas assets aprovados em `assets/brand/source-approved/vitra-premium/` ou arquivos explicitamente aprovados no brandbook/notas.

## Frontend e UX

O dashboard deve ser funcional, denso e operacional, mas com presenca premium.

Diretrizes:

- primeira tela deve ser a experiencia util, nao uma landing page;
- evitar cards decorativos aninhados;
- usar botoes com icones quando a acao for clara;
- manter texto dentro dos limites dos componentes em desktop e mobile;
- evitar excesso de copy explicativa na interface;
- telas operacionais devem priorizar leitura rapida, filtros, status e acao;
- confirmar visual com build e, quando possivel, screenshot/headless browser.

Stack atual:

- Vite;
- React;
- Tailwind;
- Supabase JS;
- lucide-react.

## Supabase e Modelo de Dados

O modelo Premium oficial da Fase 1 usa:

- `premium_campaigns`
- `premium_campaign_assets`
- `premium_content_posts`
- `premium_publications`
- `premium_metrics`
- `premium_generation_jobs`
- `social_accounts`
- `social_metric_snapshots`

Regras:

- campanha e a entidade principal;
- assets pertencem a campanhas;
- posts de conteudo podem derivar de assets;
- publicacoes representam posts reais ou importados;
- metricas pertencem a publicacoes reais;
- separar metricas organicas e pagas pelo campo `source`;
- Ads devem considerar `campaign_id`, `adset_id`, `ad_id`, gasto, impressoes, cliques, leads, CPL e conversoes;
- tokens e service role nunca entram no browser.

Antes de alterar schema:

1. criar migracao SQL em `supabase/`;
2. manter nomes consistentes e legiveis;
3. evitar quebrar tabelas existentes sem plano de migracao;
4. registrar a decisao no Obsidian.

## Backend, Jobs e Renderizacao

O browser nao deve executar logica critica de geracao final.

Fluxo desejado:

1. `Nova campanha` cria campanha, brief e jobs no Supabase.
2. Backend ou Supabase Function consome `premium_generation_jobs`.
3. Renderer aplica brandbook Premium.
4. Puppeteer/card-builder gera PNG em alta qualidade.
5. Arquivo sobe para Supabase Storage.
6. URL final volta para `premium_campaign_assets.public_url`.
7. Publicacao ou importacao cria `premium_publications`.
8. Coletor Meta atualiza `premium_metrics`.

`html2canvas` no browser pode ser usado apenas como prototipo, nao como pipeline operacional final.

## Seguranca

Nunca:

- commitar `.env`;
- hardcodar tokens;
- expor `SUPABASE_SERVICE_ROLE_KEY` no front-end;
- armazenar token Meta no browser;
- publicar dados sensiveis em logs;
- sincronizar `node_modules`, `dist`, caches ou exports temporarios.

Usar `.env.example` com placeholders.

O RLS da Fase 1 esta permissivo para desenvolvimento. Antes de producao publica, exigir autenticacao, roles e policies restritas.

## Git e Registro

Quando fizer alteracoes relevantes:

1. atualizar codigo;
2. validar build/testes;
3. atualizar notas do Obsidian se houver mudanca de escopo, arquitetura, Supabase, marca ou status;
4. commitar no repo correto;
5. quando a mudanca pertencer a ferramenta Premium, espelhar no repositorio dedicado quando necessario.

Repositorios:

- base/vault: `leoferrazbrasil/vitra-agentes-marketing`;
- ferramenta dedicada: `leoferrazbrasil/vitra-premium-ferramenta-operacional`.

Usuario Git esperado:

- `leoferrazbrasil <github@leonardobrasil.com.br>`.

## Como Trabalhar em uma Nova Tarefa

1. Ler o pedido mais recente do usuario.
2. Conferir fontes de verdade locais antes de assumir contexto.
3. Identificar se a tarefa pertence a marca-mae ou Vitra Premium.
4. Para Premium, aplicar preto/dourado, luxo discreto e brandbook Premium.
5. Fazer mudancas pequenas, coerentes e verificaveis.
6. Rodar `npm.cmd run build` em `dashboard/` quando alterar front-end.
7. Registrar decisao relevante no Obsidian.
8. Evitar tocar arquivos sujos nao relacionados.
9. Informar claramente o que foi feito, validado e o que ficou pendente.

## Proximas Fases Recomendadas

1. Transformar `premium_generation_jobs` em fila real.
2. Criar backend/Supabase Function para geracao de campanha.
3. Renderizar assets Premium server-side com Storage.
4. Criar fluxo de aprovacao de assets.
5. Mapear publicacoes reais por API.
6. Importar metricas organicas e pagas por publicacao.
7. Endurecer RLS e autenticacao.

## Principio Central

Toda decisao deve preservar a separacao entre prototipo, planejamento e producao.

O resultado final precisa ser uma ferramenta operacional confiavel, elegante e fiel a Vitra Premium: luxo silencioso, curadoria rigorosa, performance mensuravel e dados reais.
