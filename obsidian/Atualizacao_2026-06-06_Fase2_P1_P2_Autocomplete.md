# Atualizacao 2026-06-06 - Fase 2 (P1/P2) + Fix de Autocomplete

## Contexto

Primeiro teste real da Fase 1 em producao (campanha "Teste de Criativo", template financiamento-orla)
expos, na saida real, dois problemas que ja estavam mapeados na nota 09:
- **Duplicacao de copy (P1):** 8 variacoes com 5 receitas -> 3 anuncios com headline/copy identicos
  (so a foto mudava). Confirmado no banco (Financiamento = Financiamento 2, etc.).
- **Headline truncada (P2):** "Teste de headline no coracao de Porto Alegre" renderizou como
  "TESTE DE HEADLINE NO". Branch: `fase2/variacao-headline-ux`.

## Mudancas

### P1 - duplicacao
- `selectedTemplateVariationConcepts` capa a contagem ao numero de receitas distintas do template
  (`Math.min(count, recipes.length)`) -> nunca gera dois anuncios com a mesma copy. Novo
  `distinctConceptCapacity`. Decisao: nao inventar copy de marca; expandir o leque de angulos por
  template e tarefa de conteudo com o marketing (follow-up).
- Modal: aviso dinamico quando a contagem excede os angulos distintos do template.
- Testes: baseline de duplicacao (Fase 0) trocado por asserts de distincao.

### P2 - headline
- `wrapText` (Edge): preenche as 2 linhas e trunca com reticencias em vez de cortar palavra e
  descartar o resto (corrige tambem headlines curtas que perdiam palavras). Ajuda patios/dual-photo/generico.
- `maxLength` + helper nas headlines (financiamento 34, patios 40, dual-photo 44): previne na origem
  a headline que nao cabe. A financiamento-orla usa `financingHeadlineParts`, que REJEITA headlines
  > 34 chars (por isso truncou) — o `wrapText` nao a cobre; o `maxLength` resolve na entrada.
- `renderTemplateField` passa a exibir o helper em inputs de texto.

### Fix de autocomplete
- `autoComplete="off"` nos forms e inputs dos modais -> elimina o popup "Salvar documento de
  identidade?" do navegador, que classificava a headline como dado pessoal.

## Validacao

- `npm run test:run` => 51 passed; `npm run build` => ok; `deno check render-asset` => ok.
- Edge `wrapText` re-deployada (ver abaixo). Frontend: ver pendencia de host.

## Follow-up (P2 profundo / P1 expansao)

- **Auto-fit de headline LONGA por template** (financiamento/menino-deus com layout proprio):
  requer validacao visual por formato; nao feito nesta entrega (so prevencao via maxLength).
- **Ampliar o leque de angulos por template** (mais variacoes distintas): escrever receitas
  novas aprovadas pelo marketing.
- **"Aprovar todos" por campanha** (P4) e limpeza de campanhas de teste.

## Pendencia: publicar o frontend

Nao ha projeto Vercel nem config de deploy no repo (frontend rodado localmente). As mudancas de
frontend (autocomplete, cap/aviso de variacoes, maxLength) so ficam visiveis quando o dashboard
for publicado. Decisao de host pendente com o dono.
