# Atualizacao 2026-06-22 — UI do Direcionamento detalhado no painel de Tráfego

> Campo "Direcionamento detalhado" no PublishMetaPanel: aplicar preset (origem visível) + chips editáveis
> por tier + toggle Advantage + estimativa de público. Na `main`. Commit: **9d52426**.

## Entregue (front-end; backend e presets já no ar)
- **Bloco "Direcionamento detalhado"** no `PublishMetaPanel`, abaixo de "Localização", padrão = preset
  **"Intenção imobiliária (núcleo)"** (recomendado) com **Advantage = ligado** (como a vencedora).
- **Preset (origem visível):** VitraSelect com os 3 presets (`detailedTargetingPresets`), rótulo = label + origem
  (ex.: "Intenção imobiliária (núcleo) — TOM 10.06 + conjunto cidade da 30.05").
- **Chips de interesses editáveis por tier:** núcleo (dourado, **obrigatório**, sem ×) · recomendado · opcional
  (removíveis com ×). Aplicar preset recarrega os chips.
- **Interesses extras** por nome (vírgula) → vão como `interest_keywords` (busca no build).
- **Toggle Advantage (expansão)** por campanha; **estimativa qualitativa** de alcance (Amplo com expansão /
  Médio / Específico) que reage ao toggle e ao nº de interesses.
- **Ligação ao build:** `handleBuild` aplica `interest_ids` (pré-resolvidos) + `interest_keywords` (extras) +
  `advantage_audience` aos conjuntos por **geografia** (não a retarget/público custom). `build_draft` já
  materializa flexible_spec + Advantage; itens depreciados pela Meta caem no fallback (item anterior).

## Regras / validações
- Núcleo não removível; demais sim. Dedup por id (no build). Sem busca para os interesses do preset (ids
  pré-resolvidos → não quebram por item indisponível/depreciado). Advantage editável (default do preset = 1).

## Verificação (ao vivo no painel)
- lint limpo · **162 testes** ✓ · build OK.
- Preview (Murano): bloco renderizado com preset + origem, chips com tiers (Casa/Investimento dourados),
  extras, toggle Advantage; "Alcance estimado: Amplo" → ao desligar Advantage vira "Médio" (reativo).

Ver [[Atualizacao_2026-06-22_Direcionamento_Detalhado_Analise]] e [[Atualizacao_2026-06-22_Trafego_2_Conjuntos_Localizacao]].
