# Etapa 5 — render_trace (observabilidade) (2026-07-02)

Carimba em CADA asset renderizado a trilha de auditoria que faltava: "por que este criativo é o que é / por
que aprovou/reprovou". Responde de forma rastreável qual DS/template/arquétipo, quais regras, qual decisão.

## Entregue
- **`_shared/renderTrace.ts`** (novo, puro/testável): `buildRenderTrace(opts)` → `RenderTrace` com
  `ds_version`, `template_version`, `archetype`, `format`, `lint` (resumo: ok/errors/warnings/metrics),
  `decided` (`approved_by_gate` | `blocked_by_gate` | `no_lint`), `reason` (erros se bloqueado),
  `rendered_at` (ISO).
- **`render-asset`**: no `update_asset`, monta o trace (versão via `VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION`,
  arquétipo via `schemaFor(family)`, formato via `formatSpec(W,H).kind`, lint do `lintOut`) e grava em
  `metadata.render_trace`. `updated_at` reusa o mesmo `renderedAt`.

## Prova (render real, hero-checklist feed)
```
ds_version: ds-2026-07 · template_version: hero-checklist-ds-image-v6 · archetype: left-anchored
format: feed · decided: approved_by_gate · reason: null · rendered_at: 2026-07-02T14:00:11Z
lint: ok=true, warnings=[token_color:#F2F2F2, token_color:#FAFAF8, token_font:Poppins],
      metrics={max_gap:30, logo_gap:39, axis_spread:0}
```
O trace já traz a **dívida de token** (Poppins + near-whites) e as **métricas** de layout — auditável sem
re-render. Render **byte-idêntico** (trace é só metadata) → sem bump de versão, sem regenerar preview.

## Verificação
deno check + **237 testes** (+3 do renderTrace: carimbo básico, ok→approved, reprovado→blocked+reason) +
ESLint OK. Deploy CLI. Render real confirmou o trace gravado.

## Estado da spec
Etapa 1 (tokens) ✅ · 2 (componentes) ✅ · 3 (schemas/zonas) ✅ · 4 (lint v3: severidade+token_conformance
+contraste+front) ✅ · **5 (render_trace) ✅**. Restam: **6** (harness expandido + Premium + baseline de
métricas), **7** (regressão visual golden pixel-diff), **8** (governança: ciclo de vida do template + DS
versionado + checklist de PR). Pendências menores da Etapa 4: estender contraste às outras 5 + foto,
format_divergence, promover logo_crowding a erro. [[render-asset-deploy-e-limites]]
[[validacao-criativo-arquitetura]]
