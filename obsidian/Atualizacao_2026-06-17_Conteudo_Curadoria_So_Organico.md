# Atualizacao 2026-06-17 — "Conteúdo & Curadoria" = só orgânico

> Limpeza das abas internas da tela organica: a demanda PAGA saiu de "Conteúdo & Curadoria". So UI
> (lista de abas do PremiumDashboard) — fluxo de Tráfego Pago intacto. Na `main`. Commit: **74c7651**.

## Antes (6 abas)
Campanhas · Produção · **Tráfego Pago** · Publicações · **Métricas** · Modelo

## Depois (4 abas, orgânico puro)
**Ofertas** · Produção · Publicações · Modelo

## Decisoes (PO)
- **"Tráfego Pago" (aba) removida**: era DUPLICATA do destino dedicado de midia paga (item de menu
  Tráfego Pago / `focusMode`). Pago vive so la.
- **"Métricas" (aba) removida**: duplicava a Métricas transversal. As metricas ORGANICAS (frequencia de
  post, alcance, engajamento, crescimento de audiencia, desempenho de conteudo) devem morar na Métricas
  transversal com um corte Orgânico|Pago — proxima evolucao sugerida (1 home de metricas, segmentada).
- **"Campanhas" -> "Ofertas"**: nao removi o modulo porque ele e tambem o SELETOR de campanha que as
  abas organicas usam (remover quebraria a selecao). Renomeei para "Ofertas" = a raiz COMPARTILHADA
  (empreendimento), contexto neutro sem rotulo publicitario — exatamente o modelo oferta-primeiro.

## Garantias
So a lista `TABS` mudou. `focusMode='trafego'` -> `PaidTrafficWorkspace` (com o painel "Publicar na
Meta") nao foi tocado. Verificado no preview por screenshot: organica = Ofertas/Produção/Publicações/
Modelo; Tráfego Pago = Centro de Midia Paga + seletor + KPIs OK. lint, 151 testes, build OK. Os blocos
de render das abas removidas ficaram inalcancaveis (dead, reversiveis).

## Resta
Metricas organicas na Métricas transversal (corte Orgânico|Pago). Ver
[[Atualizacao_2026-06-17_IA_Menu_Organico_x_Pago]].
