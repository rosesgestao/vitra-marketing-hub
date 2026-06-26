# Atualização 2026-06-26 — Copiloto: tráfego sem config prévia + rollback de órfã (Incremento 5)

Estende o `trafego` do copiloto para **montar o rascunho de imóveis cadastrados que ainda não rodaram
mídia** (resolvendo a Página padrão da marca) e — descoberta importante no teste — **corrige a causa-raiz
de campanhas órfãs** na Meta.

## Frontend
- `premiumData.resolveBrandDefaultPage(brandScope)` — Página que a marca JÁ usa (última publicação paga
  da conta da marca; ToS de lead aceito, marca correta). Permite lançar imóvel sem o operador escolher
  Página manualmente.
- `resolveCampaignMediaConfig` agora cai para a Página padrão da marca quando o imóvel nunca rodou
  (`pageSource: 'imovel' | 'marca'`). Imóvel novo cadastrado → `hasPage=true` → o copiloto tenta o build.
- `campaignHasApprovedCreative(campaignId)` — **pré-check** (mesmo critério do build: assets meta_ads
  `approved|published` com `public_url`). O copiloto chama ANTES do build: sem criativo aprovado, NÃO
  chama a Edge (mostra erro + abre a campanha).
- Copilot: build em try/catch → card de **erro acionável** (`trafego_error`) com motivo + "Abrir a
  campanha no Tráfego Pago"; card de sucesso avisa quando usou a Página padrão da marca.

## Causa-raiz corrigida na Edge (publish-meta-ads) — ROLLBACK
Descoberto em teste: o `build_draft` **cria a campanha na Meta (linha ~487) ANTES** de validar os
conjuntos. Quando nenhum conjunto pode ser montado (copy reprovada / sem criativo), a campanha-shell
ficava **órfã** na conta. Corrigido: no `nothing_built`, a Edge agora faz **rollback** — `graphDelete`
da campanha + restaura o `meta_campaign_id` anterior; resposta inclui `rolled_back:true` e a mensagem
"Nada foi criado na Meta". Beneficia TODOS os chamadores (copiloto e painel). Deploy via Supabase CLI.

## Verificação (ao vivo, preview + banco) — com limpeza
- **Página da marca + erro gracioso:** comando para "Residencial Azenha 531" (cadastrado, sem mídia
  prévia) → o copiloto resolveu a Página padrão da marca e tentou o build. A campanha tem 3 criativos
  `approved` mas a **copy é reprovada** → `nothing_built`.
- **Antes do fix:** o build deixou 2 campanhas órfãs (120253506063880221, 120253506447320221) →
  **apagadas** via delete_draft e `meta_campaign_id` restaurado para o original (120252934350130221).
- **Depois do fix (Edge redeployada):** mesmo comando → card "Ainda não dá para montar o rascunho —
  Nada foi criado na Meta"; banco confirma `meta_campaign_id` da Azenha **inalterado** (rollback). Zero
  órfã. Console limpo; lint+build+deno check OK.
- O caminho de sucesso (Murano, Inc. 3) é intocado: o rollback só dispara quando ZERO conjunto é criado.

## Aprendizado / nota
- O `delete_draft` zera o `meta_campaign_id` da campanha — por isso o rollback **restaura o anterior**.
- Sigo recomendando hardenizar mais o build (criar a campanha só após garantir ≥1 conjunto), mas o
  rollback já elimina a órfã na prática.

Commits: front (Página da marca + pré-check + erro acionável) + Edge (rollback no nothing_built).
