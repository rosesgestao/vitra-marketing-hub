# Atualizacao 2026-06-04 - Templates Vitra Imobiliaria para Trafego Pago

## Objetivo

Registrar a aprovacao e a entrega operacional dos primeiros templates reutilizaveis de criativos da marca-mae Vitra Imobiliaria dentro da plataforma multi-marca.

## Contexto

A plataforma deixou de ser apenas uma ferramenta Premium e passou a operar dois ambientes isolados de marca:

- `Vitra Premium`: luxo, alto padrao, linguagem editorial preto + dourado.
- `Vitra Imobiliaria`: marca-mae, portfolio geral, medio e baixo padrao, identidade navy + dourado.

Para a Vitra Imobiliaria, a regra definida foi aprovar cada template individualmente antes de integrar novas estruturas ao fluxo automatico de geracao.

## O Que Foi Aplicado

- Criado e aprovado o Template 01 `vitra-imobiliaria-dual-photo-offer`, inspirado no criativo de oportunidade Zona Norte.
- Criado e aprovado o Template 02 `vitra-imobiliaria-patios-gallery`, inspirado no criativo de patio/galeria com tres fotos.
- Criado e aprovado o Template 03 `vitra-imobiliaria-financiamento-orla`, inspirado no criativo de financiamento/orla com duas fotos, bloco de preco e bairro no rodape.
- Criado e aprovado o Template 04 `vitra-imobiliaria-menino-deus-offer`, inspirado no criativo de oportunidade Menino Deus com foto hero, tarja de bairro, faixa de caracteristica principal, preco e localizacao.
- Os tres templates foram gerados nos formatos Meta Ads:
  - `1:1` quadrado;
  - `9:16` vertical;
  - `1.91:1` horizontal.
- Os Templates 02, 03 e 04 tambem foram aprovados com duas variantes:
  - com moldura fina dourada;
  - sem moldura.
- As correcoes visuais do Template 02 incluiram:
  - respeito a margem de seguranca;
  - logo aprovada da Vitra Imobiliaria;
  - fotos dentro da area segura;
  - pin de localizacao vinculado ao texto;
  - centralizacao dos elementos na versao 9:16;
  - alinhamento consistente entre headline, preco, galeria, diferenciais e localizacao.
- As correcoes visuais do Template 03 incluiram:
  - remocao do selo Minha Casa Minha Vida;
  - reducao de espacos vazios entre blocos;
  - centralizacao da logo e do texto no topo da versao `1:1`;
  - ajuste de espacamento na versao `9:16`;
  - ajuste da logo no topo da versao `1.91:1`.
- As correcoes visuais do Template 04 incluiram:
  - uso da paleta oficial da marca-mae, com navy `#0A1628` e dourado Vitra;
  - substituicao das tarjas cinza/grafite por azul oficial;
  - ajuste da palavra `OPORTUNIDADE` dentro do retangulo;
  - ajuste da faixa de transicao nos formatos `1:1`, `9:16` e `1.91:1`;
  - refinamento do separador de preco e do pin de localizacao.
- Criado o gerador `dashboard/scripts/generate-vitra-imobiliaria-template-02-patios-galeria.mjs`.
- Criado o gerador `dashboard/scripts/generate-vitra-imobiliaria-template-03-financiamento-orla.mjs`.
- Criado o gerador `dashboard/scripts/generate-vitra-imobiliaria-template-04-menino-deus.mjs`.
- Criado o catalogo operacional `docs/templates-criativos-vitra-imobiliaria.md`.
- Adicionadas ao repositorio as referencias visuais de criativos da Vitra Imobiliaria e Vitra Premium.
- Atualizado o fluxo da ferramenta para reconhecer templates aprovados da Vitra Imobiliaria no contexto de trafego pago multi-marca.

## Arquivos Gerados

- `dashboard/public/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-*`
- `dashboard/public/generated/vitra-imobiliaria/template-02-patios-galeria-*`
- `dashboard/public/generated/vitra-imobiliaria/template-03-financiamento-orla-*`
- `dashboard/public/generated/vitra-imobiliaria/template-04-menino-deus-*`
- `dashboard/scripts/generate-vitra-imobiliaria-template-02-patios-galeria.mjs`
- `dashboard/scripts/generate-vitra-imobiliaria-template-03-financiamento-orla.mjs`
- `dashboard/scripts/generate-vitra-imobiliaria-template-04-menino-deus.mjs`
- `docs/templates-criativos-vitra-imobiliaria.md`

## Regras de Marca Registradas

- Usar sempre a logo aprovada da Vitra Imobiliaria.
- Manter paleta navy + dourado da marca-mae.
- Nao reutilizar templates Premium na marca-mae.
- Nao voltar para identidade antiga azul/amarela.
- Novos templates devem passar por aprovacao individual antes de entrar no fluxo automatico.

## Validacao

- `node --check` executado no gerador do Template 02.
- `node --check` executado no gerador do Template 03.
- `node --check` executado no gerador do Template 04.
- `deno check` executado em `supabase/functions/render-asset/index.ts`.
- `npm.cmd run build` executado no dashboard com sucesso.
- Inspecao visual feita nas versoes `1:1`, `9:16` e `1.91:1`.

## GitHub

- Repositorio: `leoferrazbrasil/vitra-premium-ferramenta-operacional`
- Commit publicado: `8a62774 feat: add Vitra Imobiliaria paid traffic templates`
- Commit publicado: `5962391 feat: add Vitra Imobiliaria template catalog`
- Branch: `main`

## Catalogo Operacional Implementado

O catalogo de templates aprovados da Vitra Imobiliaria foi transformado em funcionalidade real da ferramenta.

- O modal `Nova Campanha` agora exibe um catalogo de templates filtrado pela marca selecionada.
- Para Vitra Imobiliaria, o usuario pode escolher entre os templates aprovados:
  - `vitra-imobiliaria-dual-photo-offer`;
  - `vitra-imobiliaria-patios-gallery`;
  - `vitra-imobiliaria-financiamento-orla`;
  - `vitra-imobiliaria-menino-deus-offer`.
- Quando houver variante aprovada, o usuario pode escolher entre `sem moldura` e `com moldura`.
- A selecao escolhida passa a ser persistida no `brief`, no `content_plan`, no metadata dos assets e no job de renderizacao.
- A funcao `render-asset` passou a reconhecer as familias aprovadas da marca-mae e renderizar de acordo com a familia escolhida.
- Vitra Premium permanece no modo automatico por objetivo/angulo, sem misturar os templates da marca-mae.

## Configuracao Dinamica por Template

O catalogo evoluiu de uma lista visual para um contrato operacional de template.

- Cada template aprovado agora declara seus proprios grupos de campos obrigatorios e opcionais.
- O modal `Nova Campanha` exibe apenas os campos necessarios para o template selecionado.
- Cada template declara seus proprios slots de imagem, incluindo quantidade, rotulo, obrigatoriedade e suporte a multiplas imagens.
- A validacao do modal passa a considerar o template escolhido: campos obrigatorios e fotos obrigatorias sao checados antes da criacao da campanha.
- Quando o usuario informa Google Drive, site do imovel ou outra fonte externa de fotos, o fluxo permite seguir sem upload manual imediato.
- Os valores preenchidos no template sao persistidos como `template_values`.
- Os slots de imagem do template sao persistidos como `template_image_slots`.
- Essas informacoes seguem para campanha, plano de conteudo, metadata dos assets e jobs de renderizacao.
- A funcao Supabase `render-asset` passou a usar campos variaveis especificos dos templates, como chamada de financiamento e argumento lateral de condominio.

Regra registrada: novos templates devem ser adicionados primeiro ao catalogo como manifesto de campos e imagens, para que a interface, a persistencia e o renderizador continuem escalaveis sem criar formularios duplicados.
