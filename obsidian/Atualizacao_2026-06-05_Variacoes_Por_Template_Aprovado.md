# Atualizacao 2026-06-05 - Variacoes por Template Aprovado

## Contexto

Esta nota registra as alteracoes feitas entre a ultima atualizacao do cofre e o estado atual da ferramenta operacional multi-marca, com foco no fluxo de Trafego Pago da Vitra Imobiliaria.

O ponto central foi preservar a utilidade da antiga logica de "variacoes criativas para teste", mas corrigir seu papel dentro da nova arquitetura de templates aprovados.

## Decisao Principal

A funcionalidade nao deve redesenhar criativos a cada campanha.

Ela passa a operar como **Variacoes por template aprovado**:

- a estrutura visual do template aprovado permanece fixa;
- a ferramenta varia apenas os campos permitidos pelo contrato do template;
- os elementos de marca, hierarquia, margens, molduras, posicao de logo e composicao visual nao sao alterados pelo usuario;
- a inteligencia da ferramenta fica em combinar bons argumentos de venda, fotos, headlines, copies, CTAs, valores e diferenciais.

Essa decisao mantem a funcao importante para testes de Meta Ads sem gerar retrabalho de design humano e sem comprometer a consistencia visual dos modelos aprovados.

## O Que Foi Atualizado

- O campo do modal `Nova Campanha` foi renomeado de "Variacoes criativas para teste" para "Variacoes por template aprovado".
- O modal passou a exibir quais elementos do template podem variar e quais permanecem fixos.
- O catalogo de templates passou a oferecer contratos de variacao por modelo aprovado.
- A geracao de campanhas passou a usar receitas do template selecionado para criar as variacoes.
- Cada asset gerado agora recebe metadados de `template_variation`, `creative_concept` e `product_data` proprio.
- Fotos, diferenciais, headline, copy, CTA, preco e demais campos variaveis passam a ser combinados por asset, sem alterar o layout aprovado.
- A Edge Function `render-asset` passou a mesclar dados globais da campanha com os dados especificos de cada asset.
- A configuracao local do Supabase passou a declarar `verify_jwt = false` para `render-asset`, alinhando o comportamento versionado ao deploy operacional.

## Arquivos Impactados

- `dashboard/src/lib/creativeTemplateCatalog.js`
- `dashboard/src/lib/premiumData.js`
- `dashboard/src/views/PremiumDashboard.jsx`
- `supabase/functions/render-asset/index.ts`
- `supabase/config.toml`

## Resultado Operacional

O fluxo esperado para o usuario final passa a ser:

1. selecionar a marca no dashboard;
2. abrir `Nova Campanha`;
3. escolher um template aprovado disponivel para a marca;
4. preencher apenas os campos exigidos pelo contrato daquele template;
5. definir a quantidade de variacoes por template aprovado;
6. enviar ou informar as fotos do imovel;
7. gerar os criativos.

A ferramenta entao cria `N` variacoes conceituais dentro do mesmo template aprovado e renderiza os cortes Meta Ads nos formatos previstos.

## Deploy e Validacoes

- `deno check supabase/functions/render-asset/index.ts`: aprovado.
- `node --check dashboard/src/lib/premiumData.js`: aprovado.
- `npm.cmd run build`: aprovado, com aviso normal de tamanho de bundle do Vite.
- `git diff --check`: aprovado, apenas avisos de CRLF ja esperados no Windows.
- `npm.cmd run lint`: nao executado porque o projeto nao possui script `lint`.
- Edge Function `render-asset` publicada no Supabase ativo `birxcfkyuzqnhyvetbjv`.

## GitHub

- Commit publicado: `6286f9f - Implementa variacoes por template aprovado`.
- Branch: `main`.
- Repositorio: `leoferrazbrasil/vitra-premium-ferramenta-operacional`.

## Observacoes

- Campanhas antigas podem precisar de nova geracao/reprocessamento para aproveitar a nova estrutura de metadados por variacao.
- Campanhas novas ja passam a usar a logica de variacoes por template aprovado automaticamente.
- A regra de produto permanece: novos templates devem ser criados, ajustados e aprovados visualmente antes de ficarem disponiveis no catalogo operacional.
