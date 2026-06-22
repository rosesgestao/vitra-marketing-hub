# Atualizacao 2026-06-22 — Estimativa NUMÉRICA real de público (delivery_estimate da Meta)

> Substitui a estimativa qualitativa por número real da Meta por conjunto, no painel de Tráfego.
> Na `main`. Commit: **<HASH>**.

## Entregue
- **Edge `publish-meta-ads` — ação `estimate_audience`** (read-only, não gasta): recebe `{ad_account_id,
  objective, spec}`, monta o targeting (geo raio/cidade + idade + `flexible_spec` de interest_ids +
  públicos inc/exc + Advantage) e chama `act_{id}/delivery_estimate`. Devolve `{lower, upper}` (tamanho
  mensal estimado). QUALITY_LEAD cai para LEAD_GENERATION só p/ estimar (evita erro de CRM).
- **premiumData `estimateAudience({adAccountId, objective, spec})`** — invoca a ação com o gate.
- **UI (Direcionamento detalhado):** botão **"Estimar alcance (Meta)"** estima **cada conjunto por
  geografia** (Porto Alegre + Região) com o direcionamento atual (interesses + Advantage) e mostra a faixa
  formatada (`~ X mil – Y mil/mi pessoas`). A estimativa qualitativa (Amplo/Médio) segue como leitura rápida.

## Verificação (ao vivo + curl)
- deno check + lint + **162 testes** + build OK; deploy CLI.
- Curl: Porto Alegre (cidade)+núcleo+Advantage → **875k–1M**; Região (raio 2km) sem Advantage → **57–67k**.
- UI (Murano): "Estimar alcance (Meta)" → **Região do imóvel (raio 2 km): ~64 mil–75 mil** ·
  **Porto Alegre: ~925 mil–1,1 mi** (números reais da Meta, coerentes com geo + Advantage). Screenshot conferido.

## Observação
Número aproximado (mensal) da Meta — varia com leilão/entrega; é referência de dimensionamento, não garantia.
Fecha o ciclo do Direcionamento detalhado (análise → presets → build → UI → estimativa real).
Ver [[Atualizacao_2026-06-22_Direcionamento_Detalhado_UI]].
