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
