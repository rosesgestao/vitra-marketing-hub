# Propagação v2 — hero-checklist (2026-07-01)

1ª família migrada para o gate v2 depois do oferta-ancora, na esteira do
[[Atualizacao_2026-07-01_Eixo_Unico_Overflow_QA_Harness|harness]] +
[[Atualizacao_2026-07-01_Loop_QA_Criativo_ClaudeCode|/loop]]. Processo: render real → achar problema →
consertar na fonte → declarar v2 → verde no harness (3 formatos).

## Bug real achado (não era só "faltar regra")
`heroChecklistBullets` dividia os diferenciais só em `[\n;,]`, **não em `|`**. Como o oferta usa `|`,
os diferenciais viravam **1 bullet truncado** ("3 dorms sendo 1 suíte|72m²…") + **vazio enorme** até o
CTA. Fix: split aceita `|` também → os 5 bullets aparecem completos e preenchem o espaço. Bônus: melhora
o espaçamento da barra do oferta (que agora separa com "   |   " de verdade).

## v2 declarado (arquétipo left-anchored)
- **logo** (`isLogo`+`requireLogo`) — não estava no lint.
- **eixo** — headline/De-Por/CTA no mesmo `x` → `axis_spread=0` (regressão travada).
- **preço** como `display` → hierarquia herói(headline) ≥ preço.
- **gapCap só no cluster de topo** (headline→preço→checklist). O **CTA é bottom-anchored** de propósito
  (o respiro acima flexa com a contagem de bullets 3–5) → fica FORA da cadeia de gap, coberto por
  safe-zone + overflow. Aprendizado: `dead_gap` não se aplica a CTA ancorado embaixo.
- Caixa do preço apertada (deY..porY) p/ não gerar `overlap` falso com o checklist.
- render-version hero-checklist v4→v5 (+ guard test).

## Verificação
Harness **3 formatos verdes** (axis=0). Harness completo feed+wide **24/24** (oferta intacto após o split
compartilhado). **202 testes + ESLint OK.** Cortes de inspeção removidos. (Previews do catálogo: regenerar
em lote ao fim da propagação.)

## Estado da propagação
oferta-ancora ✅ (v2 completo) · hero-checklist ✅ (v2). Restam: **duo-selos** (próxima), hero-panel,
lancamento, vitrine, oportunidade-bairro, ficha-imovel, destino-bairro (todas já no gate BASE via harness).

Commit: hero-checklist v2 + fix do split `|`. [[render-asset-deploy-e-limites]]
