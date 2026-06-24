# Atualizacao 2026-06-23 — Template 10: ajuste fino (9:16 subtítulo + 1.91:1 logo)

> Dois ajustes visuais pontuais a partir das marcações do cliente. Na `main`. Commit: **591a381**.

## Ajustes (só os elementos marcados; sem mexer em conteúdo/cores/fontes)
- **9:16 — barra de subtítulo "2 DORM. C/ SUÍTE E SACADA":** estava com largura 580 (maior que a caixa de
  preço e o checklist, ambas 470) e o canto direito **invadia a coluna da galeria**. Largura → 470: alinha
  a coluna esquerda e libera a galeria.
- **1.91:1 — caixa do wordmark VITRA:** `[902,70,210,64]` **sobrepunha a 1ª foto da galeria** e encostava na
  margem direita. Recolocada na própria faixa **acima** da galeria (`[858,60,238,62]`); a galeria desce e
  encolhe (`[136,276,416]`/128) para abrir a faixa do logo, tudo dentro da safe.

## Verificação
deno check + lint; deploy CLI; 9:16 e 1.91:1 re-renderizados (sem+com moldura) e conferidos — alinhamento,
proporção e safe zone ok, sem sobreposição/corte. **1:1 inalterado** (não tinha marcação). Previews
atualizados em public/generated/vitra-imobiliaria.

Ver [[Atualizacao_2026-06-23_Template_10_Oportunidade]].
