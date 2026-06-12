# Atualizacao 2026-06-12 — Refino de UI (fase 2): header/hero + modal Nova Campanha

> Continuacao de [[Atualizacao_2026-06-12_Refino_UI_Fase1_Central]]. Aprofundamento do header/hero da
> tela e do modal Nova Campanha, validado nas DUAS marcas. Na `main`, pushado. Commit: **d34dfcf**.
> So apresentacao, zero logica.

## Header/hero
- **CTA primario solido**: "Nova campanha" deixa de ser outline-tint e vira botao dourado solido —
  hierarquia clara contra o "Atualizar" (secundario/ghost). A tinta do botao vem de `--surface-0`,
  entao fica **navy na Imobiliaria e preto na Premium automaticamente** (mesmo padrao dos CTAs dos
  criativos). Truque reaproveitavel para qualquer botao primario brand-aware.
- **Titulo Playfair** com `tracking-tight`, leading mais justo e um tico maior.

## Modal Nova Campanha
- **Header elevado**: eyebrow com hairline dourada + nome curto da marca (IMOBILIARIA / PREMIUM) e
  titulo "Nova campanha" em Playfair, no lugar do h2 chapado. Amarra o modal a linguagem das telas.
- **"Criar Campanha"** padronizado como CTA primario solido (mesma linguagem do header), tinta
  brand-aware. O footer ja era sticky com borda — mantido.

## Validacao nas 2 marcas
Abri header e modal na **Imobiliaria** (navy+dourado) e na **Premium** (preto+dourado): eyebrow do
modal mostra a marca certa, CTAs solidos com a tinta correta por marca, **sem azul na Premium**,
console limpo. Lint limpo, build OK.

## Padrao reaproveitavel (para as proximas fases)
CTA primario = `bg-gold-500 text-[color:var(--surface-0)] hover:bg-gold-400`. Secundario = ghost com
borda branca/10. Eyebrow = `hairline dourada + kicker uppercase tracking`. Numero/destaque grande em
off-white (#F4EFE3) com dourado de acento. Esse vocabulario ja vale para espalhar aos demais paineis
(Estudios, Pipeline, Kanban, Metricas) na proxima fase.
