# Propagação v2 — ficha-imovel (2026-07-01)

5ª família (depois de [[Atualizacao_2026-07-01_Propagacao_v2_Vitrine|vitrine]]). Arquétipo **COLUNA navy à
esquerda** (logo, headline, subtítulo/localização, cards de atributo com ícone, card de preço branco/dourado
left-anchored) + galeria à direita.

## BUG real
Headline truncava em **18 chars** (`compactText(headline, 18)`) → "Apartamento no…" em vez de "Apartamento
no Rio Branco". Fix: cap **18→30**, alinhado ao `charLimit` do lint — ≤30 renderiza inteiro (encolhe pela
largura); >30 o gate **reprova** em vez de exibir cortado (comportamento determinístico). Split de features
passou a aceitar `,` também.

## v2 declarado
- logo (`requireLogo`), **eixo** (headline/subtítulo/footer no mesmo x → axis=0; o valor do card de preço é
  centrado, então fica fora do eixo), headline `charLimit=30` (== cap do render), cards e preço como block.
- O gate **pegou a logo do WIDE 3px acima da safe-zone** (y 60→66) — mesmo tipo de achado do oferta-ancora.
- ficha v1→v2. **6/6 previews do catálogo regenerados**.

## Verificação
Harness **3 formatos verdes** (axis=0; wide reprovou `safe_zone:logo` antes do fix — gate funcionando).
202 testes + ESLint OK. Cortes removidos.

## Placar (selecionáveis)
oferta-ancora ✅ · hero-checklist ✅ · duo-selos ✅ · vitrine ✅ · **ficha-imovel ✅** · (hero-panel ✅ oculto).
Falta **1 selecionável: destino-bairro** (próxima). Depois, ocultos: lancamento, oportunidade-bairro.
Padrão: cada família revelou um bug de fábrica distinto (split `|`, priceChip, colisão por wrap, truncagem
de headline, logo fora da safe-zone) — a propagação está endurecendo a base inteira.

Commit: ficha v2 (headline sem truncar + logo safe-zone) + previews. [[render-asset-deploy-e-limites]]
