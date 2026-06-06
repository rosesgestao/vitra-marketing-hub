# Registro de Decisoes

## 2026-05-29 - Inicio da Documentacao Operacional

Foi criada esta pasta no cofre Obsidian para registrar o desenvolvimento da ferramenta operacional Premium antes de iniciar implementacao.

### Contexto

O arquivo `planejamento_vitra_premium/dashboard-conteudo.html` ja funciona como prototipo local para criacao de campanhas e conteudos Vitra Premium.

O objetivo agora e evoluir esse prototipo para uma ferramenta operacional conectada a banco, storage, publicacao e metricas.

### Decisoes Iniciais

- Documentar antes de implementar.
- Tratar o HTML atual como prototipo/referencia, nao como sistema final.
- Migrar a experiencia para o dashboard React existente em `dashboard/`.
- Usar Supabase como fonte de verdade para campanhas, assets, publicacoes e metricas.
- Manter separacao rigida entre Vitra Premium e Vitra Imobiliaria.
- Nao expor tokens de redes sociais no front-end.

### Pendencias

- Definir schema SQL final.
- Definir status oficiais de campanha e asset.
- Definir quais metricas serao coletadas de Instagram/Facebook organicamente.
- Definir se publicacao sera automatica, manual ou hibrida.
- Revisar compatibilidade entre schema atual `metricas` e os coletores existentes.

## 2026-05-29 - Repositorio GitHub Dedicado

Foi criado um repositorio exclusivo para o desenvolvimento da ferramenta operacional Premium.

### Repositorio

`https://github.com/leoferrazbrasil/vitra-premium-ferramenta-operacional`

### Decisoes

- Repositorio criado como privado.
- Nome escolhido: `vitra-premium-ferramenta-operacional`.
- O repositorio atual `vitra-agentes-marketing` segue como base de referencia e cofre historico.
- Nenhum codigo foi migrado ou copiado ainda para o novo repositorio.

### Proximo Passo

Definir o escopo inicial do novo repositorio antes de clonar/pushar arquivos: app React isolado, pacote full-stack, ou extracao gradual a partir de `dashboard/` e `planejamento_vitra_premium/dashboard-conteudo.html`.

## 2026-05-29 - Escopo Oficial Definido

O escopo oficial do projeto foi definido a partir da analise do que falta para transformar o prototipo `dashboard-conteudo.html` em ferramenta operacional.

### Referencia

[[06 - Escopo Oficial do Projeto]]

### Prioridade

1. Migrar o dashboard Premium para React + Supabase.
2. Criar tabelas de campanha, assets, publicacoes e metricas.
3. Mover geracao e renderizacao para backend com Supabase Storage.
4. Implementar integracao Meta para importar publicacoes e metricas por post.

## 2026-05-29 - Fase 1 Iniciada e Base Aplicada

Foi iniciada a migracao do prototipo Premium para o dashboard React existente em `dashboard/`.

### Entregas

- Criada a tela principal `Premium` no dashboard React.
- Criado o formulario `Nova campanha` conectado ao modelo Premium.
- Criada a camada de dados React/Supabase para campanhas, assets, posts, publicacoes, metricas, jobs e contas sociais.
- Criada a migracao `supabase/migration-premium-operational.sql`.
- Aplicada a migracao no projeto Supabase `birxcfkyuzqnhyvetbjv`.
- Confirmado via REST que as 8 tabelas Premium estao acessiveis pelo dashboard.

### Decisoes

- A Fase 1 cria assets e conteudos como registros planejados, nao como artes finais.
- A renderizacao com `card-builder.js`, Storage e jobs reais fica para a Fase 2/3.
- Tokens de Meta, Instagram, Facebook e Ads nao serao armazenados no browser.
- O acesso RLS da migracao esta permissivo para a Fase 1 e deve ser endurecido com autenticacao antes de producao publica.

## 2026-05-29 - Cofre Atualizado com Estado Atual da Fase 1

Foi criada a nota [[../Atualizacao_2026-05-29_Ferramenta_Operacional_Premium_Fase_1]] para registrar o estado atual completo entre a ultima atualizacao do cofre e o projeto atual.

### Confirmacoes

- Conta Supabase confirmada: `souleonardobrasil`.
- E-mail Supabase confirmado: `github@leonardobrasil.com.br`.
- Organizacao Supabase confirmada: `Vitra Imobiliaria`.
- Projeto Supabase confirmado: `Marketing Vitra Imobiliaria`.
- URL Supabase confirmada: `https://birxcfkyuzqnhyvetbjv.supabase.co`.

## 2026-05-29 - Plano Operacional Fases 2, 4 e 5 Minimas

- A captura de campanha deve manter paridade com o prototipo `planejamento_vitra_premium/dashboard-conteudo.html`.
- Campos comerciais extras ficam em `premium_campaigns.brief.product_data`, evitando migracao desnecessaria para cada atributo de campanha.
- Uploads de imagem devem usar o bucket `cards` e registrar os resultados em `brief.images`, `premium_campaign_assets.source_image_url` e `premium_campaign_assets.metadata.source_images`.
- A aba de metricas deve usar somente `premium_publications` e `premium_metrics`; as tabelas antigas `metricas` e `publicacoes` nao sao fonte da ferramenta Premium.
- Ate a integracao Meta existir, metricas podem ser registradas manualmente por publicacao real.
- O mapeamento manual de publicacao real e obrigatorio para fechar o ciclo minimo conteudo -> publicacao -> metrica.
- A consulta REST mascarada a `premium_campaigns` confirmou acesso ao projeto `birxcfkyuzqnhyvetbjv`.
- O bucket `cards` ainda precisa de confirmacao/policy adequada: a consulta ao endpoint do bucket retornou erro `400`.
- Repositorio exclusivo atualizado: `leoferrazbrasil/vitra-premium-ferramenta-operacional`.
- Commit do repositorio exclusivo: `d22eb86 feat: add premium operational dashboard phase 1`.
- Commit do repositorio base: `01779f8 feat: add premium operational dashboard phase 1`.

### Decisao

O cofre passa a tratar o repositorio exclusivo `vitra-premium-ferramenta-operacional` como a base dedicada da ferramenta operacional Premium, enquanto `vitra-agentes-marketing` segue como base historica, vault e ecossistema de agentes.

## 2026-05-29 - Paridade Final do Modal Nova Campanha e Commit Phase 2

- O modal `Nova Campanha` do React foi ajustado para seguir o mesmo conjunto de campos do prototipo `planejamento_vitra_premium/dashboard-conteudo.html`.
- Campos visiveis finais: nome do produto, tagline/empreendimento, localizacao, metragem, suites, andares/torres, diferenciais, preco, headline sugerida, copy sugerida, CTA padrao e uploads de fachada/principal, interior/living, varanda/vista, infraestrutura/lazer e imagens extras.
- Campos operacionais extras deixaram de aparecer no modal, mas seguem com defaults internos quando necessarios para manter compatibilidade com `premium_campaigns`.
- O fallback de nome da campanha passou a usar o nome do produto, mantendo a logica esperada pelo prototipo.
- A localizacao preenchida pelo usuario passa a ser exibida no resumo da campanha a partir de `brief.product_data.location`.
- Validacao executada: `npm.cmd run build` no dashboard do repositorio dedicado, com sucesso.
- Repositorio exclusivo atualizado: `leoferrazbrasil/vitra-premium-ferramenta-operacional`.
- Commit do repositorio exclusivo: `bdc4804 feat: apply premium operational dashboard phase 2`.

## 2026-06-01 - Esteira de Automacao para Trafego Pago

- A ferramenta passa a tratar a campanha de Meta Ads como fluxo operacional de baixa intervencao humana.
- O modal `Nova Campanha` recebeu campos de origem: tipo da fonte, link/caminho da fonte, landing page, WhatsApp de atendimento e observacoes para automacao.
- A fonte pode ser Google Drive, site, pasta local/rede, PDF comercial, landing page ou brief manual.
- O brief gravado em `premium_campaigns.brief` agora registra `source_intake`, `automation_workflow`, politica de revisao humana e politica de QA.
- Os assets de Meta Ads passam a carregar `metadata.qa_checks`, `metadata.source_intake`, `metadata.automation_stage` e campos iniciais de anuncio Meta.
- A aba `Campanhas` exibe a esteira operacional: fonte recebida, brief estruturado, fotos vinculadas, criativos gerados, QA automatico, aprovacao/exportacao.
- A aba `Trafego Pago` passa a exibir QA operacional por anuncio e um botao para exportar pacote JSON com textos, UTMs, cortes e URLs dos criativos.
- Publicacao com verba segue bloqueada por decisao de produto: a ferramenta prepara pacote/draft, mas exige aprovacao humana para criativos e autorizacao de orcamento.
- Validacao executada: `npm.cmd run build` no dashboard do repositorio dedicado, com sucesso.

## 2026-06-01 - Menu Proprio para Trafego Pago Premium

- Decidido adotar modelo hibrido para usabilidade: `Premium` continua com a aba contextual `Trafego Pago`, mas a sidebar passa a ter um menu proprio `Trafego Pago`.
- O menu dedicado funciona como centro operacional de midia paga para o usuario que precisa gerar, revisar, aprovar e exportar criativos Meta Ads sem navegar por varias camadas.
- A nova area dedicada reutiliza o mesmo motor de campanha, renderizacao, QA e exportacao; nao cria fonte de dados paralela.
- Foi adicionado seletor de campanha na area de Trafego Pago para alternar rapidamente entre filas de criativos.
- A area dedicada exibe a esteira de automacao da campanha selecionada antes dos cards de Meta Ads, reforcando o fluxo: fonte -> brief -> fotos -> criativos -> QA -> aprovacao/exportacao.
- A aba interna em `Premium` permanece para leitura de contexto por campanha e para usuarios que estao no fluxo amplo de planejamento.
- Validacao executada: `npm.cmd run build` no dashboard do repositorio dedicado, com sucesso.

## 2026-06-01 - Ingestao Automatica de Fotos de Origem

- Identificado que os links de Google Drive/site eram registrados apenas como referencia em `source_intake`, sem alimentar `premium_campaign_assets.source_image_url`.
- Criada a Edge Function `ingest-source-images` para extrair imagens publicas a partir de `og:image`, `twitter:image`, `<img>`, `srcset`, JSON-LD e previews publicos do Google Drive.
- Novas campanhas passam a tentar selecionar automaticamente fotos publicas das fontes informadas e gravar essas imagens em `brief.images.auto`.
- Ao clicar em `Gerar cortes`, campanhas antigas sem `source_image_url` tentam ingerir fotos das fontes registradas, vinculam imagens aos assets de Meta Ads, reenfileiram criativos nao aprovados e limpam renders anteriores sem foto.
- O renderer `render-asset` passou a aceitar qualquer grupo de `brief.images` como fallback, nao apenas `fachada`.
- O QA de Meta Ads passa a exigir `Foto do imovel`, evitando que um criativo tipografico sem imagem seja tratado como pronto para aprovacao/exportacao.
- Limite tecnico registrado: pastas privadas do Google Drive exigem integracao futura com Drive API; a ingestao atual funciona melhor com paginas publicas, imagens diretas e previews publicos.
- Validacao executada: `npm.cmd run build` no dashboard do repositorio dedicado, com sucesso.

## 2026-06-01 - Fallback Local para Fotos HEIC e Renderizacao Estavel

- Confirmado em producao local que a Edge Function `ingest-source-images` ainda nao estava publicada no Supabase, retornando 404.
- Adicionado fallback local no Vite em `/api/ingest-source-images` para extrair fotos de paginas publicas e ler pastas locais seguras dentro de `D:\LEONARDO`.
- A pasta real do imovel estava em `D:\LEONARDO\Vitra Imobiliaria\Imoveis\Luvre\Fotos` com arquivos `.HEIC`; esse formato nao era aceito no fluxo anterior.
- Instaladas as dependencias `heic-convert` e `sharp` para converter HEIC em JPEG, redimensionar para ate 1600px e comprimir antes do upload ao bucket `cards`.
- As imagens locais passam a ser enviadas ao Supabase Storage e retornam como URLs publicas utilizaveis pela Edge Function `render-asset`.
- A renderizacao automatica foi reduzida para lote unitario, evitando `WORKER_RESOURCE_LIMIT` ao renderizar criativos com fundo fotografico.
- A campanha mais recente `Louvre Gallerie 4` foi atualizada com 9 imagens reais, 9 assets Meta Ads receberam `source_image_url` e 9 criativos foram renderizados com sucesso.
- Validacoes executadas: `node --check`, `npm.cmd run build`, teste do endpoint local, upload Storage e inspeção visual de criativo renderizado com foto real do imovel.

## 2026-06-02 - Validação Criativa com Mais Variações

- Decidido ampliar a etapa de teste criativo de trafego pago para refletir a pratica recomendada por especialistas em marketing imobiliario.
- O modelo antigo gerava 3 anuncios Meta fixos (`Awareness`, `Leads`, `Retargeting`), cada um com 3 cortes, totalizando 9 criativos.
- O modal `Nova Campanha` agora permite escolher entre 3, 5, 8, 10 ou 12 variacoes criativas para teste.
- Cada variacao continua saindo nos 3 formatos obrigatorios da Meta: `1:1`, `9:16` e `1.91:1`.
- A configuracao padrao passa a ser 8 variacoes, totalizando 24 cortes Meta por campanha.
- As variacoes testam angulos diferentes: editorial, curadoria, criterio de compra, diferenciais, localizacao, lifestyle, investimento, escassez, arquitetura, liquidez, prova premium e WhatsApp consultivo.
- A campanha registra `brief.creative_validation` com quantidade, cortes por variacao, total de cortes e conceitos usados.
- O pacote exportado de Meta Ads passa a incluir a estrategia de validacao criativa da campanha.
- A renderizacao continua em lote unitario para reduzir risco de limite de worker ao gerar alto volume de criativos com fotos.
- Validacao executada: `node --check dashboard\src\lib\premiumData.js` e `npm.cmd run build` no dashboard, ambos com sucesso.

## 2026-06-02 - Templates Padronizados a Partir das Referencias Premium

- Analisada a pasta `referencias-criativos-exemplos-vitra-premium/` com 11 JPGs de referencia.
- Leitura tecnica: as referencias possuem boa logica comercial para trafego pago, mas a estetica original tem tracos de varejo imobiliario, azul dominante, excesso de preco/chamadas e caixas muito agressivas.
- Decisao: preservar a logica de performance das referencias e traduzir para identidade Vitra Premium, com preto + dourado, linguagem editorial, tipografia Playfair/Inter, foto protagonista e CTA consultivo.
- Criados 5 modelos reutilizaveis: `premium-photo-offer`, `premium-editorial-panel`, `premium-dark-spec`, `premium-location-panorama` e `premium-gallery-proof`.
- Cada conceito de Meta Ads agora grava `metadata.visual_template`, permitindo que o renderizador aplique estrutura visual padronizada sem exigir escolha manual do usuario.
- A aba `Trafego Pago` exibe o nome do modelo visual usado em cada anuncio para facilitar QA.
- O pacote exportado de Meta Ads inclui `visual_template` no grupo do anuncio e em cada placement.
- O worker full-res e a Edge Function `render-asset` foram atualizados para respeitar os modelos visuais.
- Documentacao tecnica criada em `docs/templates-criativos-vitra-premium.md`.

## 2026-06-02 - Deno Instalado para Validacao de Edge Functions

- Decidido instalar Deno no ambiente local porque o projeto seguira evoluindo arquivos em `supabase/functions/*`.
- Instalacao realizada em modo usuario: `C:\Users\leona\.deno\bin\deno.exe`, sem exigir permissao administrativa.
- Versao instalada: Deno `2.8.1`.
- `deno check` passa a ser validacao padrao para Supabase Edge Functions antes de commit/deploy.
- A primeira execucao identificou erro real de tipagem em `supabase/functions/ingest-source-images/index.ts`, onde URLs normalizadas estavam sendo inferidas como `unknown[]`.
- Corrigida a normalizacao de `body.urls` para `string[]` explicito usando `Set<string>`.
- Validacao final executada com sucesso: `deno check supabase/functions/render-asset/index.ts` e `deno check supabase/functions/ingest-source-images/index.ts`.

## 2026-06-02 - Deploy Remoto das Edge Functions Premium

- Publicadas no projeto Supabase ativo `birxcfkyuzqnhyvetbjv` as funcoes `render-asset` e `ingest-source-images`.
- `render-asset` publicado como versao remota `9`, status `ACTIVE`.
- `ingest-source-images` publicada como versao remota `2`, status `ACTIVE`.
- As funcoes foram publicadas com `--no-verify-jwt` porque o dashboard usa chave publishable (`sb_publishable...`), que nao e JWT classico; a validacao continua sendo feita dentro da funcao por `apikey`/`Authorization`.
- Teste remoto de `render-asset` com payload vazio retornou `400` controlado: `informe campaign_id ou asset_ids`.
- Teste remoto de `ingest-source-images` com `urls: []` retornou `200` com `images: []` e `warnings: []`.
- Validacao local previa mantida com `deno check` nas duas funcoes antes/depois do deploy.

## 2026-06-02 - Correcao dos Cortes Queued com Imagens WebP

- Identificado que a campanha `Louvre Gallerie 7` tinha fotos vinculadas aos assets, mas os cortes continuavam `queued` porque o `render-asset` falhava dentro do Satori antes de salvar o PNG.
- Causa raiz: o servidor de imagens do imovel retornava arquivos WebP mesmo quando a URL/headers sugeriam JPEG; o Satori nao renderizava esse formato de forma confiavel no Edge Runtime.
- O `render-asset` passou a detectar WebP por assinatura binaria (`RIFF WEBP`) e converter para PNG via WASM antes de montar o card.
- As fontes do Satori foram trocadas de WOFF para TTF estavel, mantendo Inter e Playfair Display conforme o brandbook Vitra Premium.
- A funcao agora registra a etapa da falha (`load_image`, `satori`, `resvg`, `upload`, `update_asset`) em `metadata.last_render_error`, facilitando diagnostico operacional futuro.
- `Louvre Gallerie 7` foi reprocessada no Supabase ativo: 15 assets Meta Ads ficaram `generated_with_url`, sem pendencias `queued`.
- Validacoes executadas: `deno check supabase/functions/render-asset/index.ts`, deploy remoto de `render-asset`, chamada real da Edge Function e inspecao visual de PNG renderizado com foto do imovel.

## 2026-06-02 - Plataforma Operacional Multi-Marca

- Decidido nao criar duas ferramentas separadas neste momento.
- O modelo adotado passa a ser uma unica plataforma operacional com dois ambientes de marca isolados dentro do dashboard: `Vitra Premium` e `Vitra Imobiliaria`.
- A sidebar agora separa os fluxos de marca em grupos proprios, cada um com `Painel` e `Trafego Pago`, mantendo `Pipeline`, `Calendario`, `Conteudos`, `Agentes` e `Metricas` como operacao compartilhada.
- Criada a camada `brandProfiles`, com escopos `vitra_premium` e `vitra_imobiliaria`, para controlar nomes, CTAs, tom, audiencia, fallback de campanha, pacotes de exportacao, copy e regras visuais.
- O carregamento de workspace passou a filtrar campanhas, assets, posts, publicacoes, metricas, jobs e contas sociais por `brand_scope`.
- Campanhas novas gravam `brand_scope` em `brief`, `content_plan`, `qa_policy`, assets, posts, jobs e exportacoes Meta Ads.
- O renderizador remoto `render-asset` foi atualizado para escolher logo, fundo, overlay e pasta de Storage conforme o escopo da marca.
- Para Vitra Imobiliaria, o render usa a logo da marca-mae, navy/dourado e linguagem institucional/comercial; para Vitra Premium, preserva preto/dourado e linguagem editorial de alto padrao.
- Versionada a migracao `supabase/migration-brand-scope-multimarca.sql`, que cria colunas derivadas `brand_scope` e indices para filtros server-side futuros sem exigir mudanca imediata no frontend.
- Adicionado `deno.json` com `nodeModulesDir: auto`, tornando reproduzivel a validacao das Edge Functions com imports `npm:` e `jsr:`.
- Edge Function `render-asset` publicada novamente no projeto Supabase ativo `birxcfkyuzqnhyvetbjv`.
- Validacoes executadas: `npm.cmd run build` no dashboard e `deno check supabase/functions/render-asset/index.ts`, ambos com sucesso.
- Tentativa de validacao visual pelo navegador interno falhou por erro do runtime de browser do Codex antes da abertura da pagina; a validacao funcional ficou coberta por build, Deno e deploy remoto.

## 2026-06-03 - Migracao Multi-Marca Aplicada no Supabase

- Finalizada a pendencia tecnica da migracao `supabase/migration-brand-scope-multimarca.sql`.
- O checkout local foi linkado ao projeto Supabase ativo `birxcfkyuzqnhyvetbjv`.
- A migracao foi aplicada no banco remoto via `supabase db query --linked --file`.
- Validado remotamente que as colunas geradas `brand_scope` existem em `premium_campaigns`, `premium_campaign_assets`, `premium_content_posts`, `premium_publications` e `premium_generation_jobs`.
- Validado remotamente que os indices `idx_premium_*_brand_scope` foram criados nas cinco tabelas operacionais.
- A plataforma multi-marca agora possui isolamento funcional no frontend e suporte estrutural no banco para filtros server-side por marca.

## 2026-06-03 - Assets Aprovados Centralizados no Dashboard

- Decidido que a ferramenta operacional deve manter seu proprio pacote de assets aprovados, sem depender em runtime de caminhos absolutos do projeto `vitra-agentes-marketing`.
- Criado o pacote publico `dashboard/public/brand/` com manifests controlados para `vitra_premium` e `vitra_imobiliaria`.
- Foram copiados apenas assets essenciais aprovados: SVGs, PNGs 8K e PNGs 6x necessarios para UI, avatars, logos horizontais, logos verticais e variacoes de aplicacao.
- Arquivos 16K e pastas experimentais/teste, como `horizontal-teste-descritor-largo`, ficaram fora do pacote operacional.
- O pacote final possui 51 arquivos e aproximadamente 10,8 MB.
- `brandProfiles.js` passou a apontar para `assetBasePath`, `assetManifestPath` e `approvedAssets` de cada marca.
- O render remoto `render-asset` continua com SVG inline para preservar estabilidade no Supabase Edge Runtime, enquanto o dashboard passa a ter uma biblioteca publica canônica para uso operacional e futuras telas/exportadores.
- Validacoes executadas: parse dos tres manifests JSON e `npm.cmd run build` no dashboard, ambos com sucesso.

## 2026-06-04 - Templates Aprovados da Vitra Imobiliaria para Trafego Pago

- Decidido que os templates da Vitra Imobiliaria serao aprovados individualmente antes de entrar no fluxo automatico da ferramenta.
- A marca-mae deve ter catalogo proprio de templates, separado do catalogo da Vitra Premium, para evitar mistura de identidade, tom, CTA e posicionamento.
- Aprovado o Template 01 `vitra-imobiliaria-dual-photo-offer` para campanhas de oportunidade/oferta com duas fotos, capsula de preco, CTA e slogan.
- Aprovado o Template 02 `vitra-imobiliaria-patios-gallery` para imoveis com argumentos de patio, suite, metragem, baixo condominio, vaga/localizacao e galeria com tres fotos.
- O Template 02 foi aprovado nos formatos `1:1`, `9:16` e `1.91:1`, com variantes com moldura fina dourada e sem moldura.
- Aprovado o Template 03 `vitra-imobiliaria-financiamento-orla` para campanhas de financiamento, oportunidade a partir, bairro/localizacao e argumentos de acesso/valorizacao.
- O Template 03 foi aprovado nos formatos `1:1`, `9:16` e `1.91:1`, usando logo horizontal aprovada no topo, headline centralizada, duas fotos com moldura dourada, bloco de preco e bairro no rodape.
- O Template 03 tambem foi padronizado com variantes `com-moldura` e `sem-moldura`, seguindo o mesmo criterio operacional dos Templates 01 e 02.
- Criado o catalogo `docs/templates-criativos-vitra-imobiliaria.md` para registrar os modelos aprovados da marca-mae.
- Criado o gerador `dashboard/scripts/generate-vitra-imobiliaria-template-02-patios-galeria.mjs` para reproduzir o Template 02 em todos os formatos aprovados.
- Criado o gerador `dashboard/scripts/generate-vitra-imobiliaria-template-03-financiamento-orla.mjs` para reproduzir o Template 03 em todos os formatos aprovados.
- Regra de produto/design: novos modelos de criativos da marca-mae devem ser primeiro gerados, ajustados e aprovados visualmente antes de ficarem disponiveis para selecao no modal `Nova Campanha`.
- Commit publicado no GitHub: `8a62774 feat: add Vitra Imobiliaria paid traffic templates`.

## 2026-06-04 - Template 04 Menino Deus Aprovado

- Aprovado o Template 04 `vitra-imobiliaria-menino-deus-offer` para campanhas de oportunidade por bairro, menor valor de condominio, diferenciais comerciais e imoveis com foto protagonista.
- O Template 04 foi aprovado nos formatos `1:1`, `9:16` e `1.91:1`, com variantes `com-moldura` e `sem-moldura`.
- O modelo usa foto hero, tarja de oportunidade/bairro, logo horizontal aprovada, faixa de caracteristica principal, bloco de preco, argumento lateral, diferenciais e localizacao com pin.
- Correcoes aprovadas: tarjas e faixas no navy oficial `#0A1628`, ajuste da palavra `OPORTUNIDADE` dentro do retangulo, separador de preco afastado de `MIL`, pin vinculado ao endereco e faixas de transicao padronizadas.
- Criado o gerador `dashboard/scripts/generate-vitra-imobiliaria-template-04-menino-deus.mjs` para reproduzir o Template 04 em todos os formatos aprovados.

## 2026-06-04 - Catalogo de Templates no Modal Nova Campanha

- Decidido que os templates aprovados deixam de ser apenas referencias visuais e passam a ser selecionaveis no fluxo operacional.
- Criado o catalogo central `dashboard/src/lib/creativeTemplateCatalog.js`, filtrado por `brand_scope`.
- Vitra Premium permanece com selecao automatica por objetivo/angulo, preservando a logica ja validada.
- Vitra Imobiliaria passa a exibir no modal `Nova Campanha` os templates aprovados `dual-photo-offer`, `patios-gallery`, `financiamento-orla` e `menino-deus-offer`.
- Quando o template possui variantes aprovadas, o usuario escolhe entre `sem moldura` e `com moldura`.
- A escolha e persistida no `brief`, `content_plan`, metadata dos assets e job de renderizacao.
- A Edge Function `render-asset` reconhece as familias aprovadas da marca-mae e aplica a rota visual correspondente na geracao dos criativos Meta Ads.

## 2026-06-05 - Variacoes por Template Aprovado

- Decidido manter a funcionalidade de variacoes criativas para teste, mas reposiciona-la como `Variacoes por template aprovado`.
- A ferramenta nao deve redesenhar a peca a cada variacao; o template aprovado permanece fixo e apenas os campos permitidos pelo contrato do template podem mudar.
- O catalogo de templates passa a declarar quais slots sao variaveis e quais elementos permanecem travados em cada modelo.
- O modal `Nova Campanha` foi atualizado para mostrar essa logica ao usuario, reduzindo ambiguidade operacional.
- A geracao de campanha passou a criar variacoes com `template_variation`, `creative_concept` e `product_data` por asset.
- As variacoes combinam argumentos de venda, fotos, headlines, textos, CTAs, valores e diferenciais sem comprometer posicao de logo, margens, moldura, hierarquia e composicao.
- A Edge Function `render-asset` foi atualizada para mesclar dados globais da campanha com dados especificos de cada asset antes da renderizacao.
- A funcao `render-asset` foi publicada no projeto Supabase ativo `birxcfkyuzqnhyvetbjv` com `verify_jwt=false`, conforme o fluxo operacional atual.
- Validacoes executadas: `deno check`, `node --check`, `npm.cmd run build` e `git diff --check`.
- O projeto nao possui script `lint`, portanto `npm.cmd run lint` nao foi aplicavel.
- Commit publicado no GitHub: `6286f9f Implementa variacoes por template aprovado`.

## 2026-06-06 - Geracao Automatica de Cortes Render Asset

- Identificado que o navegador chamava `render-asset`, mas a funcao remota bloqueava o preflight porque `x-client-info` nao estava permitido no CORS.
- A Edge Function `render-asset` foi atualizada para permitir `authorization`, `x-client-info`, `apikey`, `content-type` e os metodos `POST, OPTIONS`.
- A funcao foi publicada no Supabase ativo `birxcfkyuzqnhyvetbjv`.
- Validado remotamente que o preflight `OPTIONS` agora retorna `access-control-allow-headers` com `x-client-info`.
- Apos a correcao de CORS, o erro transitorio `546` foi reproduzido e tratado como oscilacao da Edge Function.
- O frontend passou a fazer retry curto e controlado para `546`, `502`, `503`, `504` e `failed to fetch`.
- O processamento automatico permanece em lotes unitarios por asset para reduzir risco de limite de runtime/memoria.
- Chamada real para asset pendente retornou `200 OK` e gerou PNG no bucket `cards`.
- Validacoes executadas: `deno check supabase/functions/render-asset/index.ts`, teste remoto de preflight, POST real da funcao, `npm.cmd run build` e `git diff --check`.
- Commit publicado no GitHub: `65fe9a5 Corrige geracao automatica de criativos`.

## 2026-06-06 - Reconciliacao do cofre com commits recentes

- Registrado, para fechar a lacuna do log, que apos `65fe9a5` entraram na `main`:
  `761cc88 Corrige renderizacao e navegacao do dashboard` e
  `3cb812e Registra atualizacao do render asset no Obsidian`.
- A partir daqui o cofre passa a ser reconciliado tambem com o estado tecnico real do projeto,
  nao apenas com o ultimo commit.

## 2026-06-06 - Auditoria Senior (Dev + Designer + Produto)

- Executada auditoria senior multi-perspectiva do projeto (produto, frontend, backend/dados,
  design/UX e fluxos ponta-a-ponta), com leitura do codigo real e verificacao de evidencias.
- Estado real confirmado: Fases 1-3 concluidas; Fase 4 parcial (so importacao manual de
  publicacao); Fase 5 parcial/ausente (metricas so manuais, integracao Meta 100% ausente).
- Achados que contrariam a percepcao: abas Agentes/Pipeline consultam tabelas inexistentes no
  schema Premium (visao de roadmap, nao operacional); geracao de copy e por templates, nao IA;
  a "incompatibilidade de schema de metricas" do escopo nao existe no codigo.
- Riscos priorizados: seguranca de Fase 1 exposta (RLS aberto, bucket publico, `verify_jwt=false`);
  fila de render (corrida, mismatch de canal, cron com placeholder); ausencia de testes/CI.
- Resultado consolidado registrado em [[08 - Auditoria e Plano de Evolucao]].

## 2026-06-06 - Pass de Honestidade da UI

- Decidido, como primeira acao de manutencao apos a auditoria, fazer um pass de baixo risco que
  alinha a interface ao estado real, sem alterar schema, fila de render, RLS ou contratos de Edge.
- Removido o rotulo interno do template (MODEL_LABEL) que era gravado no PNG final entregue.
- Botoes "Aprovar" (AssetCard, CarouselCard, MetaAdCard) migrados do verde fora-de-paleta para a
  escala gold do brandbook; logica de estados preservada.
- StatTile de Leads: sub "Ads Insights" trocado por "entrada manual".
- Criado componente reutilizavel `RoadmapNotice`; banner aplicado em Agentes e Pipeline marcando-as
  como visao de roadmap ainda nao implementada (queries e comportamento inalterados).
- `docs/escopo-oficial.md` item 6 reescrito como historico (sem pendencia de schema).
- Validacao executada: `npm run build` no dashboard, com sucesso.
- Trabalho feito na branch `limpeza/honestidade-ui`, merge fast-forward na `main` e push.
- Commit publicado no GitHub: `652ba6e Alinha a UI ao estado real (pass de honestidade)`.
- Nota de atualizacao: [[../Atualizacao_2026-06-06_Limpeza_Honestidade_UI]].

## 2026-06-06 - Plano de Evolucao Acordado

- Definida a ordem de evolucao a executar como mantenedor, preservando as decisoes ja tomadas:
  (A) rede de seguranca (CI + Vitest nas funcoes puras + teste da fila),
  (B) fila de render (reivindicacao atomica, alinhar filtro de canal, corrigir/desativar cron),
  (C) endurecer fundacao (RLS/roles, bucket nao-publico, `verify_jwt`, centralizar `brand_scope`),
  (D) refator dos god-files apos a rede de seguranca,
  (E) fatia fina de integracao Meta (importar metricas organicas por post) para fechar o ciclo.
- Principio: nada de prometer na UI automacao que nao existe; mudancas incrementais, reversiveis e
  validadas por build; mexer em seguranca/RLS so com coordenacao previa.
- Detalhamento, esforco e decisoes pendentes em [[08 - Auditoria e Plano de Evolucao]].
