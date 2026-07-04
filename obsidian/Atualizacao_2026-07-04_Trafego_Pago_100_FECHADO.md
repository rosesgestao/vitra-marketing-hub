# Tráfego Pago — 100% FECHADO — 2026-07-04

Encerramento do foco "finalizar 100% a seção Tráfego Pago". Todos os itens P0/P1/P2 do roadmap
([[Atualizacao_2026-06-26_Auditoria_Trafego_Pago_Roadmap]]) estão feitos ou conscientemente mitigados.

## Placar final do roadmap
| Item | Status | Onde fechou |
|------|--------|-------------|
| P0.1 Premium ≥1080px | ✅ | `2bc5e5c` (SCALE 0.55→1.0) |
| P0.2 9:16 determinístico (546) | ✅ **mitigado** (decisão do Leonardo) | ver abaixo |
| P0.3 falhas silenciosas | ✅ | `6df4188` (aviso conta/Página) + `312fb4d` (render/geo) |
| P0.4 feedback de ops longas | ✅ | `2ac011a` (barra/skeleton/build) |
| P0.5 gate único | ✅ | `312fb4d` (export) + `3abb60d` (adReadiness) |
| P1.1 fluxo guiado (stepper) | ✅ | wizard 3 passos (Onda 3) + auto-seleção |
| P1.2 editar→re-render | ✅ | volta pra fila no saveAd |
| P1.3/1.4/1.7 automação/golden/tokens | ✅ | sistema determinístico (layoutKit/creativeLint/golden/token_conformance) |
| P1.5 QA legível + acionável | ✅ | `9d2a9b1` |
| P1.6 primitivos Vitra UI | ✅ | Ondas 2/3 |
| P1.9 responsividade | ✅ | `0588b6a` (painel já responsivo + tabela) |
| P2.1 3 formatos juntos + safe-zone + zoom | ✅ | `ce11459` |
| P2.2 progressive disclosure | ✅ | wizard 3 passos + avançados em `<details>` (Onda 3) |
| P2.3 tabular + tooltips | ✅ | StatTile (já) + tooltips do QA (`9d2a9b1`) |
| P2.4 destino explícito | ✅ | campo manual no PublishMetaPanel |

## P0.2 — por que "mitigado" e não código novo (decisão)
O 546/WORKER_RESOURCE_LIMIT no 9:16 full-res **mata o isolate** — o retry genérico re-tentaria na mesma
escala. Um retry que **reduz a escala no 546** resolveria, mas **conflita com o P0.1** (9:16 ≤1080px perde
qualidade). O fix sem troca é o **render-worker** (9:16 fora do isolate, flag `VITE_WORKER_RENDER_9X16`) —
lift operacional maior.

Defesas atuais já tornam o 9:16 majoritariamente confiável: `SCALE_TALL=0.75` + `TALL_RASTER=0.85`
(memória, **tunáveis por secret SEM novo deploy**), `limit=1` para formato alto (nunca empilha dois
1080×1920), retry genérico 4x + reaper de renders travados. **Decisão:** tratar como mitigado; só tunar os
secrets se o 546 reaparecer nos logs; render-worker fica como upgrade futuro se a demanda de 9:16 crescer.
Invariante intocado: Meta sempre PAUSED + ativar só com confirm.

## Como validar no ar (logado, em vitrapremium.com.br)
Tráfego → campanha: gerar cortes (barra "N de M" + skeleton) · card com pendência → clicar "Textos + CTA"
abre editor · lint reprovado → "Validação visual" salta pro corte · abas viram miniaturas dos 3 cortes ·
toggle "zona segura" · clicar preview abre em tamanho real · conta/Página sem token → aviso âmbar.

## Próximo (fora do Tráfego, quando o Leonardo quiser)
Onda 4 estrutural: split do PremiumDashboard.jsx (5.6k linhas) — extrair helpers puros do Meta para
`lib/` com testes de guarda; Métricas com gráfico; unificar Produção de Conteúdo (Kanban+Calendário).
[[Atualizacao_2026-07-04_Trafego100_UX_P0_P1]] [[deploy-hostinger-vitrapremium]]
