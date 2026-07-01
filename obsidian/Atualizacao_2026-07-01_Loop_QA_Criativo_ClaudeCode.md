# /loop do Claude Code amarrado ao QA Harness (2026-07-01)

Fecha o pedido de "loop automatizado que impede erros básicos antes de exibir", por cima do
[[Atualizacao_2026-07-01_Eixo_Unico_Overflow_QA_Harness|QA Harness]] determinístico.

## O que foi amarrado
- **Harness executável com 1 arquivo:** `dashboard/scripts/creative-qa.mjs` agora carrega
  `dashboard/.env.qa.local` (gitignored) sem dependência nova (parser inline). `dashboard/.env.qa.example`
  (committed) já vem com URL + publishable key + campanha + imagem; **só falta a `SUPABASE_SERVICE_ROLE_KEY`**
  (Supabase → Settings → API → service_role). Sem env, sai 2 com instrução de setup.
- **Slash-command `/qa-creative`** (`.claude/commands/qa-creative.md`, LOCAL/gitignored como as skills): é
  o corpo do loop — roda `npm run qa:creative`, lê as linhas FAIL, mapeia cada regra ao conserto certo
  (underfill/overflow→layoutKit, axis→eixo, dead_gap→distributeV, price_weak, char_limit/safe_zone),
  corrige SÓ o reprovado, deno check + testes, deploy, re-roda; **rollback** se aumentar FAIL; para no
  verde ou no `--max` (default 4). Critérios de aceite: qa:creative sai 0 + test/lint limpos + nada mexido
  no que já estava verde.

## Como usar (no ambiente do Leonardo)
1. `cp dashboard/.env.qa.example dashboard/.env.qa.local` e colar a service_role key.
2. Manual: `cd dashboard && npm run qa:creative`.
3. Loop que se autocorrige: **`/qa-creative`** (uma passada com conserto) ou **`/loop /qa-creative`** (repete).

## Papel do loop (decisão registrada)
O JULGAMENTO é determinístico (harness+lint) — não depende do modelo. O `/loop` é a camada de CONSERTO:
resolve sozinho as classes de erro conhecidas em template existente; para template NOVO, encurta os
ciclos mas a autoria do builder ainda é humana/assistida. Complementa a Fase 2 (auto-regeneração no
motor), não a substitui.

## Verificação
`node --check` do harness OK; run sem env sai 2 com a mensagem de setup; o caminho render+lint que o
harness automatiza já foi provado na v5 (axis_spread=0, fill_bar=0.94). Não dá para rodar o loop completo
aqui: a service_role key não está nesta máquina (só no ambiente do Leonardo) — por isso o handoff de 1 passo.

Commit: harness carrega .env.qa.local + .env.qa.example; /qa-creative é local. [[render-asset-deploy-e-limites]]
