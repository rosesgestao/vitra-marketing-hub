# Atualizacao 2026-06-06 — Limpeza de honestidade da UI

## Contexto

Primeiro pass apos a auditoria senior (dev + designer + produto) de 2026-06-06. Objetivo:
alinhar a interface ao que esta de fato implementado, sem mudar comportamento, schema, fila
de render, RLS ou contratos de Edge Function. Branch: `limpeza/honestidade-ui`.

Principio que guiou o pass: a ferramenta deve dizer a verdade sobre o que e operacional vs.
planejado. Nada de prometer automacao (Meta, agentes, IA generativa) que ainda nao existe em
codigo, e nada de expor artefato de debug na entrega final.

## Mudancas

1. **Rotulo de debug removido do criativo final.** `render-asset/index.ts` desenhava o nome
   interno do template (MODEL_LABEL, ex.: "Foto protagonista + oferta") no canto do PNG que
   vai para o Meta Ads. Removido o no visivel; a constante permanece (ainda usada por
   `modelKey`) e o rastreio interno continua em `metadata.visual_template`.

2. **Botao "Aprovar" dentro da paleta black+gold.** Os CTAs de aprovacao (AssetCard,
   CarouselCard, MetaAdCard) usavam verde esmeralda `rgba(29,158,117)`/`#6ee7b7`, cor que nem
   existe nos tokens. Migrados para `#C4942A` solido (gold-500) com texto `#0A0A0A`, coerente
   com o chip de CTA dos proprios criativos. Toda a logica de estados (approved / valid /
   hasPendingRender) foi preservada.

3. **Metricas: rotulo honesto.** O StatTile de Leads exibia sub "Ads Insights", sugerindo
   coleta automatica que nao existe. Trocado por "entrada manual".

4. **Abas Agentes e Pipeline marcadas como roadmap.** Ambas consultam tabelas legadas
   (`conteudos`, `calendario_editorial`, `publicacoes`, etc.) que nao fazem parte do schema
   operacional Premium, e por isso exibiam atividade sempre "aguardando". Adicionado um banner
   reutilizavel `RoadmapNotice` (novo, em `PremiumShell.jsx`) deixando claro que sao visao de
   roadmap, ainda nao implementadas. Queries e comportamento inalterados — so o aviso.

5. **Escopo reconciliado.** `docs/escopo-oficial.md` item 6 afirmava uma incompatibilidade de
   schema de metricas (likes/visualizacoes_video/novos_seguidores vs seguidores/curtidas/
   visualizacoes). A auditoria confirmou que isso NAO existe no codigo: `premium_metrics` usa
   `likes`/`video_views`/`follows` e o insert manual usa os mesmos nomes; os termos pt sao so
   labels de UI. Item reescrito como historico, sem pendencia.

## O que NAO foi tocado (deliberadamente)

- Schema do banco, migrations, RLS e bucket de Storage.
- Fila de render (corrida Edge x worker, filtro de canal, cron com placeholder) — proximo passo.
- Estrutura dos god-files (`PremiumDashboard.jsx`, `premiumData.js`) — depende de rede de
  testes/CI antes de refatorar.
- Queries das views legadas e a decisao de remove-las da navegacao — a confirmar com o dono.

## Verificacao

- `npm run build` (Vite) executado apos as mudancas. (Ver resultado na sessao.)
- Mudancas puramente visuais/textuais + remocao de no de render; sem alteracao de fluxo.

## Proximos passos sugeridos

- Rede de seguranca: CI com `vite build` + Vitest nas funcoes puras de `premiumData.js`.
- Cluster da fila de render (reivindicacao atomica, alinhar filtro de canal, corrigir/desativar cron).
- Endurecer RLS / bucket antes de qualquer exposicao publica.
