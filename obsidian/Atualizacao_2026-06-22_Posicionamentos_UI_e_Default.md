# Atualizacao 2026-06-22 — Posicionamentos: default seguro no build + UI "Plataformas" + re-build Murano

> Frente 1 (default no build) + Frente 2 (UI editável) + comparação lado a lado da Murano. Na `main`. Commit: **<HASH>**.

## Contexto (o gap que motivou)
A campanha `Murano | Leads (formulario) 2026-06-19` foi lida na Meta e estava com **publisher_platforms = None**
(Advantage+ = TODOS os locais, incl. AN/Messenger) e **advantage_audience 0** — oposto da referência. Motivo:
foi criada **antes** das features (tudo 22/06) e a base de 22/06 só ACEITAVA posições, não as ENVIAVA.

## Frente 1 — default seguro no build (efeito imediato)
`buildGeoAdSets` agora nasce com o preset **fb_ig_recomendado** (FB+IG + posições exatas). Toda campanha
nova sobe com os posicionamentos corretos, sem depender da UI. `placementKey` parametrizável.

## Frente 2 — UI "Plataformas e posicionamentos" (PublishMetaPanel)
Bloco editável: preset (origem) → toggles de plataforma (FB/IG/Messenger/AN) → checkboxes de posicionamento
por plataforma (incompatíveis marcados ⚠) → avisos (incompatível com 4:5/9:16, entrega restrita, AN/Messenger
de baixa qualidade p/ lead) → **Restaurar recomendado**. Advantage+ omite posições (Meta otimiza tudo).
`handleBuild` injeta `publisher_platforms` + `*_positions` nos conjuntos por geografia; em Advantage+ neutraliza
o `placements` coarse para realmente omitir. Catálogo PT em `PLATFORM_META`.

## Frente 3 — re-build da Murano (PAUSED) + comparação
Nova campanha PAUSED `120253161779440221` (não ativada, não gastou). Leitura lado a lado:
| | plataformas | FB positions | IG positions | AN/Msgr | adv |
|---|---|---|---|---|---|
| **Antiga 19/06** | None (todos) | None | None | — | 0 |
| **Nova (corrigida)** | facebook, instagram | feed, marketplace, story, facebook_reels, profile_feed | stream, story, explore, reels, profile_feed | OFF | 1 |
→ A nova bate exatamente com a referência (TOM 30.05/10.06).

## Verificação
lint + **162 testes** + build OK. UI ao vivo: bloco renderizado com recomendado; aviso de incompatibilidade
disparou ao marcar "Coluna da direita". Build PAUSED conferido via read_campaign_config.

Ver [[Atualizacao_2026-06-22_Posicionamentos_Analise_Base]].
