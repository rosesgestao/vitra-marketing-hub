# Atualizacao 2026-06-17 — Conteúdo Fase D: Métricas com corte Orgânico | Pago

> A Métricas transversal ganha segmentacao Orgânico x Pago, com KPIs proprios de cada mundo. Na `main`.
> Commit: **d09c658**.

## Entregue
- **Corte Orgânico | Pago** na `Metricas.jsx`: pills **Todos · Orgânico · Pago** filtram tiles, totais e
  tabela. O segmento de cada metrica e derivado do `publication_type` da publicacao ligada
  (`paid`/`dark_post` = pago; `organic`/`manual`/demais = organico).
- **KPIs por segmento** (separacao de mundos — sem metrica paga no organico e vice-versa):
  - **Orgânico**: Alcance · Engajamento (likes+comentarios+compart.) · Salvos · Novos seguidores.
  - **Pago**: Alcance · Cliques · Leads · Investimento (com CPL).
  - **Todos**: visao geral (alcance/impressoes/engajamento/investimento).
- So UI (Metricas.jsx), reusa `loadPremiumWorkspace`. Entrada manual e sync da Meta seguem iguais.

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview: dashboard carregou estavel (6 campanhas — load resiliente OK);
Métricas com as pills Todos/Orgânico/Pago; ao trocar, os tiles mudam corretamente (Orgânico mostra
Novos seguidores/Salvos; Pago mostra Cliques/Investimento/Leads).

## Resta (fora deste corte da Fase D)
- **Biblioteca** (DAM): repositorio de assets/fotos/templates/legendas reutilizaveis.
- **Configuracoes editoriais**: tela para pilares/tons/frequencia/diretrizes (hoje pilares/tipos/tons
  vivem como config no contentPlaybook).
- Opcional: publicacao nativa via Graph (Instagram/Facebook organico) e import de metricas organicas.

Fecha o nucleo do canal organico (Fases A-D). Continuacao de
[[Atualizacao_2026-06-17_Conteudo_FaseC_Unifica_Board_Calendario]]. Ver [[conteudo-organico]].
