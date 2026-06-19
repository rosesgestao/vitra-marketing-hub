# Atualizacao 2026-06-19 — Correções P0 (Tráfego Pago + Copywriter zeradas)

> Fecha as 3 correções P0 do diagnóstico integrado: coerência do guard na UI, redeploy do gate e aviso
> de criativo pulado. Na `main`. Commit: **<HASH>**.

## Contexto
O diagnóstico PO/dev das features Tráfego Pago + Copywriter apontou 3 pendências P0 (coerência/erro),
todas pequenas e sem mudança de arquitetura. Resolvidas todas neste ciclo.

## Entregue
### P0.1 — Coerência do guard na UI (corrige inconsistência)
- `revalidateCopyAngle` (premiumData) agora aceita **`channel`** e repassa ao `validateCopyAngle`.
- A chamada do **fluxo de copy de anúncio** (`PremiumDashboard.jsx`, edição ao vivo dos drafts) passa
  **`channel:'paid'`** — espelha a Edge `generate-copy`. Fim do falso positivo: "alto padrão"/"exclusiva"
  não são mais sinalizados na edição da copy paga da Imobiliária; "curadoria" (Premium) **continua** sinalizado.
- +2 testes em `variation.test.js` (canal pago libera genéricos; mantém Premium).

### P0.2 — Redeploy do gate de publicação
- `publish-meta-ads` redeployado via **Supabase CLI** (lê do disco, sem divergência) → **v20 ACTIVE**,
  agora com o `copyValidation` contexto-aware e `channel:'paid'` no `build_draft`. Disco == prod.

### P0.3 — Aviso de criativo pulado (deixa de ser silencioso)
- `build_draft`: criativos com copy reprovada agora entram em **`skipped_creatives`** (group_key, asset_id,
  headline, issues) e a `message` informa quantos foram pulados — antes era `continue` mudo.
- UI ("Revisar e publicar"): bloco âmbar listando os criativos não publicados e o motivo de cada um.

## Verificacao
- `deno check` publish-meta-ads OK; deploy CLI → **v20** (confirmado via get_edge_function: copyValidation
  novo + channel:'paid' + skipped_creatives presentes).
- Dashboard: lint limpo, **162 testes** ✓ (2 novos do canal pago na revalidação), build OK.
- Preview: sem erros no console após HMR.

## Estado (P0 zerados)
generate-copy v10 + publish-meta-ads v20 + UI coerentes; sem divergência disco↔prod. Restam só itens de
**produto/dados** (não-correções): porta in-app da `vitra-copy` (P1), fotos reais, 1ª campanha ativa +
métricas (P2), v2 das skills + QUALITY_LEAD/CRM (P3-P4). Ver [[Atualizacao_2026-06-19_Skill_Vitra_Copy_e_Guard_Contextual]].
