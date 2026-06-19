# Atualizacao 2026-06-19 — Auditoria das skills vitra-trafego e vitra-copy + correções

> Auditoria PO/dev das duas skills (instalação, estrutura, integração, I/O) e correção da inconsistência
> de `QUALITY_LEAD`. Na `main`. Commit: **50ad173**.

## Diagnóstico
Ambas as skills são **Claude Code skills** (`.claude/skills/`, gitignored, invocadas em sessão pelo
operador) — não componentes de runtime do dashboard. A "integração" delas é: (a) serem descobríveis;
(b) referenciarem código real (fonte única); (c) produzirem saída consumível pelo app.

**Estrutura/instalação — OK nas duas.** `SKILL.md` + `references/*.md` presentes; frontmatter válido
(`name`/`description`); descobertas na sessão. Todas as referências de código citadas **existem**
(`objectivePlaybook.ts`, `copyValidation.ts`, edge `generate-copy`, helpers `presetBlueprintFromConfig`/
`readMetaCampaignConfig`/`listMetaPresets`/`saveMetaPreset`, tabelas `premium_*`).

## Correções aplicadas
### 1) vitra-trafego instruía `QUALITY_LEAD` (inconsistência) — corrigido
A skill mandava emitir `optimization_goal: "QUALITY_LEAD"` no preset, mas o `objectivePlaybook` reverteu
para **`LEAD_GENERATION`** (QUALITY_LEAD é rejeitado pela Meta sem CRM). Corrigi os 5 pontos
(SKILL.md: fonte única, critério de depreciação, JSON de exemplo, nota nova; playbook: tabela + nota da
campanha de referência) para **LEAD_GENERATION** como padrão, deixando claro que a 30.05 usa QUALITY_LEAD
mas isso **não** se copia para o preset até haver CRM.

### 2) `presetBlueprintFromConfig` gravava QUALITY_LEAD enganoso — corrigido (código)
`premiumData.js:753` copiava o `optimization_goal` da campanha de referência (QUALITY_LEAD na 30.05) para
o blueprint. O `build_draft` **ignora** esse campo (deriva do `objectivePlaybook` = LEAD_GENERATION), então
não quebrava o build — mas o preset salvo ficava **enganoso**. Agora normaliza QUALITY_LEAD → LEAD_GENERATION
para refletir o que será de fato construído.

## Verificação
- `grep` confirma: nenhuma instrução de QUALITY_LEAD restante (só notas de contexto); todas as refs de
  código existem; os 4 helpers citados existem em `premiumData.js`.
- Dashboard: lint limpo, **162 testes** ✓, build OK.

## Estado (operacional)
- **vitra-trafego:** ✅ operacional e validado (ciclo importar→preset→auto-seed→build PAUSED 2×). Saída
  (JSON do preset) consumida pelo `MetaPresetsPanel`. Inconsistência de QUALITY_LEAD eliminada.
- **vitra-copy:** ✅ operacional em sessão (estrutura, refs e schema de saída coerentes com o asset/`meta_ad`
  e a Edge `generate-copy` v10 com guard pago). **Não é defeito**, mas a **porta in-app** de 1 clique (gerar
  3 ângulos → aplicar ao criativo) segue como **P1** do roadmap — hoje o operador transfere a copy
  manualmente / via "Gerar copy com IA".

Ver [[Atualizacao_2026-06-19_Correcoes_P0_Trafego_Copywriter]] e [[Atualizacao_2026-06-19_Skill_Vitra_Copy_e_Guard_Contextual]].
