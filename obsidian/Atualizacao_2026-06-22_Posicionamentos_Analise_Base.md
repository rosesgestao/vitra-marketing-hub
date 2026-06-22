# Atualizacao 2026-06-22 — Posicionamentos manuais (referências) + presets + base backend

> Análise dos posicionamentos das campanhas de referência + 3 presets + base no build_draft. Na `main`. Commit: **fba657f**.

## Configuração encontrada (read_campaign_config estendido)
**Plataformas — TODOS os 3 conjuntos (30.05 ×2 + 10.06):** `['facebook','instagram']`.
→ **Messenger e Audience Network DESATIVADOS** em todos. **Advantage = 1**.

**Facebook positions (idêntico nas 3):** feed, marketplace, story, facebook_reels, profile_feed, notification.
**Instagram positions:** stream(feed), story, reels, profile_feed — e a **macro 30.05** ainda com **explore** + **profile_reels**.
**NÃO usados (nenhum conjunto):** coluna da direita (right_hand_column), vídeos in-stream, resultados de
pesquisa, instant article, Messenger, Audience Network.

## Semelhanças / diferenças
- **Iguais:** plataformas (FB+IG), FB positions, ausência de Messenger/AN, Advantage=1.
- **Única diferença:** IG da macro 30.05 tinha **explore + profile_reels** a mais (as outras 2 não).

## Relação posicionamento × formato × performance
Os posicionamentos escolhidos casam 100% com os 2 formatos disponíveis: **Feed 4:5** (feed, marketplace,
profile_feed, stream, explore, notification) e **Story/Reels 9:16** (story, facebook_reels, reels,
profile_reels). Os locais que exigiriam outra arte (coluna da direita 1.91:1, in-stream em vídeo) ficaram de
fora — decisão coerente. Excluir AN/Messenger é padrão para **qualidade de lead** (AN traz clique barato e
ruim; Messenger não serve a lead form).

## Presets criados (`_shared/placementPresets.ts`)
1. **Facebook + Instagram (recomendado)** — espelha a referência (FB+IG, sem Messenger/AN; feed+stories+reels+
   marketplace+perfil+explore). **Padrão**.
2. **Só Feed + Stories/Reels (enxuto)** — subconjunto; encaixe perfeito nos 2 formatos.
3. **Automático (Advantage+ posicionamentos)** — omite posições; Meta escolhe tudo (inclui AN/Messenger).
Cada preset declara `needs_formats` (feed/story) + mapa `PLACEMENTS_NEEDING_OTHER_FORMATS` (incompatíveis).

## Base backend entregue (deploy CLI)
- `read_campaign_config`: captura `facebook/instagram/messenger/audience_network_positions`.
- `build_draft`/`targetingFor`: aceita **posições explícitas** por conjunto (`publisher_platforms` +
  `*_positions`) com precedência sobre o parser coarse; sem nada → omite (= Advantage+ todos os locais).

## Pendente (UI — próxima entrega)
Campo "Plataformas" no `PublishMetaPanel`: aplicar preset (origem) → toggles de plataforma (FB/IG/Messenger/AN)
+ posicionamentos por plataforma (checkboxes) → editar → aviso de incompatibilidade com os formatos 4:5/9:16
→ alerta de entrega muito restrita → restaurar recomendado. Diferença manual × Advantage+ explícita.

Ver [[Atualizacao_2026-06-22_Estimativa_Publico_Meta]] e [[Atualizacao_2026-06-22_Direcionamento_Detalhado_UI]].
