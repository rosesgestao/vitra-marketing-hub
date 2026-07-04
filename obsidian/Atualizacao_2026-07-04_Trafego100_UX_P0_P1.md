# Tráfego Pago 100% — lote de UX (P0.3 · P1.5 · P0.4 · P1.9) — 2026-07-04

Foco declarado do Leonardo: **finalizar 100% a seção Tráfego Pago**. Auditoria de 2026-06-26
([[Atualizacao_2026-06-26_Auditoria_Trafego_Pago_Roadmap]]) revalidada com 2 agentes + histórico de
commits: o grosso do P0/P1 já estava fechado (Premium full-res, lead form, gate único, wizard,
editar→re-render, primitivos). Este lote fecha os 4 gaps de frontend restantes. Escopo escolhido: "tudo,
incluindo P2".

## Feito (4 commits, todos no ar)
1. **P0.3 — falhas silenciosas** (`6df4188`): os 2 `.catch(()=>{})` da auto-descoberta de conta/Página
   Meta agora setam um `connMsg` (banner âmbar com AlertTriangle, abaixo do grid): "não consegui listar
   automaticamente, digite o ID manualmente". Fallback manual intacto; limpa ao carregar.
2. **P1.5 — QA legível + acionável** (`9d2a9b1`): fontes 10→11px (text-2xs) nos checks/cabeçalho e 9→10px
   nas caixas de lint. Cada check REPROVADO com correção vira botão: textos/descrição/destino abrem o
   editor do anúncio; "Validação visual (lint)" salta o preview para o corte reprovado (`setIdx`).
   Tooltip (`title`) por check via `META_QA_HINTS` (serve P2.3).
3. **P0.4 — progresso de operações longas** (`2ac011a`): estado `renderProgress` ligado nos 2 caminhos de
   render (auto + botão "Gerar cortes"); o manual agora também dá refresh ao vivo por corte. Barra +
   contagem tabular ("N de M · X gerado(s)") no header + rótulo do botão "Gerando… (N/M)" — dados reais do
   `onProgress` do `_renderCampaignAssets`. Skeleton pulsante ("gerando corte…") no MetaAdCard. Build Meta
   ganha sub-linha honesta do que o edge faz (sem inventar etapas).
4. **P1.9 — responsividade** (`0588b6a`): o painel do Tráfego já era responsivo (grids sm/lg/xl + chips
   flex-wrap); o ofensor que sobrava era a tabela de métricas (6 col fixas) → agora `overflow-x-auto` +
   `min-w-[600px]` (rola no mobile) + `tabular-nums`.

## Verificação
build 1558 módulos + 240 testes + lint em cada item. Fluxo/visual = validação do Leonardo no ar (painel
só alcançável logado). Checklist de teste no ar: gerar cortes → barra "N de M" + skeleton; check reprovado
→ abre editor; "Validação visual" reprovada → salta pro corte.

## Restante do "100%"
- **P2 (polish)**: preview dos 3 formatos juntos + safe-zone; progressive disclosure no NewCampaignModal
  (recolher "Importar IA"/avançado). *(tabular + tooltips já saíram nos itens acima.)*
- **P0.2 (backend)**: retry específico do erro 546 no render 9:16 — isolado, deploy via Supabase CLI +
  render real (risco de OOM; mitigar com bump de render-version). Último item.
[[Atualizacao_2026-07-04_Onda4_adReadiness_FonteUnica]] [[deploy-hostinger-vitrapremium]]
