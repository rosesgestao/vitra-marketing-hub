# Atualização 2026-06-26 — Promoção escopada da ui-ux-pro-max (Opção A, com salvaguardas)

Decisão do usuário após a avaliação ([[Atualizacao_2026-06-26_Avaliacao_Skill_UIUX_ProMax]]): promover
**apenas** a skill `ui-ux-pro-max` (não o bundle de 8), com as salvaguardas recomendadas.

## O que foi feito
1. **Escopo:** copiado **só** `.claude/skills/ui-ux-pro-max/` (do dir de avaliação) para o projeto. Os 7
   irmãos (design, design-system, ui-styling, brand, banner-design, slides) **ficaram de fora**. Confirmado
   que a skill é **autossuficiente** (zero referência cruzada às outras do bundle).
2. **Salvaguarda — auto-trigger:** o `description` (era keyword-stuffing gigante) foi reescrito para
   **design genérico, fora de marca**, com **precedência explícita**: trabalho visual Vitra → `direcao-de-arte`/
   `frontend-design`/`gerar-criativo` (autoridade de marca); esta skill só sob **pedido explícito**.
3. **Salvaguarda — docs:** a seção "When to Apply" (estava **em chinês**) virou um **guard-rail de marca**
   em PT (não usar em contexto Vitra; usar só em design genérico sob pedido).
4. **Salvaguarda — Python:** nota de Windows (`python`, não `python3`); shebangs `#!/usr/bin/env python3`
   são inofensivos (invocamos via `python`). Limpo `__pycache__`.

## Estado final
- **Local:** `.claude/skills/ui-ux-pro-max/` (local, gitignored — como as outras 8 skills do projeto).
- **Versão:** 2.10.0.
- **Registrada:** sim — aparece no registro de skills com o `description` já estreitado.
- **Skills no projeto:** 9 (as 8 + ui-ux-pro-max), convivendo.

## Validação funcional pós-promoção
`python .claude/skills/ui-ux-pro-max/scripts/search.py "real estate listing site" --design-system` →
**`EXIT=0`**, design-system completo. Rodou **standalone** (só a ui-ux-pro-max presente), provando que é
autossuficiente e funcional já promovida. Python 3.13 (via `python`).

## Pendências / observações
- **Pacote novo (4 dias):** revalidar antes de futuros `init`/upgrade (supply-chain).
- **Não rodar `uipro init` no projeto:** ele despeja os 8 — qualquer atualização deve ser cópia manual só
  da pasta `ui-ux-pro-max`.
- **Output é genérico:** se usada, revisar a saída contra o brandbook antes de aplicar em qualquer peça Vitra.

Sem commit de código (a skill é gitignored). Esta nota documenta a promoção.
