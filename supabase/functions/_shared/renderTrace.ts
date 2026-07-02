// Vitra Render Trace (Etapa 5 — observabilidade). Carimba em cada asset renderizado o QUE o Edge sabe:
// versão do design system, versão do template, arquétipo, formato, resumo do lint e a DECISÃO do gate.
// PURO (Deno + Vitest). Gravado em `metadata.render_trace` — auditável ("por que aprovou/reprovou").
import { DS_VERSION } from "./designTokens.ts";
import type { LintReport } from "./creativeLint.ts";

export interface RenderTrace {
  ds_version: string;
  template_version: string | null;
  archetype: string | null;
  format: string;
  lint: { ok: boolean; errors: string[]; warnings: string[]; metrics: Record<string, number> } | null;
  decided: "approved_by_gate" | "blocked_by_gate" | "no_lint";
  reason: string | null;
  rendered_at: string;
}

export function buildRenderTrace(opts: {
  templateVersion?: string | null;
  archetype?: string | null;
  format: string;
  lint?: LintReport | null;
  renderedAt: string;
}): RenderTrace {
  const l = opts.lint ?? null;
  const ok = l ? l.ok : true;
  return {
    ds_version: DS_VERSION,
    template_version: opts.templateVersion ?? null,
    archetype: opts.archetype ?? null,
    format: opts.format,
    lint: l ? { ok: l.ok, errors: l.errors, warnings: l.warnings, metrics: l.metrics ?? {} } : null,
    decided: l ? (ok ? "approved_by_gate" : "blocked_by_gate") : "no_lint",
    reason: l && !ok ? l.errors.join(", ") : null,
    rendered_at: opts.renderedAt,
  };
}
