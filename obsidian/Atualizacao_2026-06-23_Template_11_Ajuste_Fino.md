# Atualizacao 2026-06-23 — Template 11: ajuste fino (preço full-width + remoção de telefone/site)

> Ajustes visuais a partir das marcações do cliente. Na `main`. Commit: **<HASH>**.

## Ajustes (só os elementos marcados)
- **Card de preço → largura total da coluna**, com o valor preenchendo o card (fit pelo tamanho real):
  1:1 `[72,748,514,116]` base 92 · 9:16 `[80,1232,508,134]` base 102 · 1.91:1 preenche o vão entre os
  cards e a galeria `[466,274,348,92]` base 66.
- **Removidos telefone e site** do rodapé (1:1 e 9:16): o rodapé passa a ter **só o CTA**. Removidas as
  variáveis `phone`/`website` do builder e os campos correspondentes do catálogo (fieldGroups +
  variableFields). `fixedBrandRules`: `contact_footer` → `cta_footer`.
- **1.91:1**: galeria recolhida 4px para dentro da safe (`[836,268,...]`).

## Verificação
deno check + lint + **164 testes** + build; deploy CLI. 3 formatos re-renderizados (sem+com moldura) e
conferidos — preço em largura total preenchendo, rodapé só com CTA, sem cortes/sobreposições, dentro da
safe. Previews atualizados em public/generated/vitra-imobiliaria.

Ver [[Atualizacao_2026-06-23_Template_11_Ficha]].
