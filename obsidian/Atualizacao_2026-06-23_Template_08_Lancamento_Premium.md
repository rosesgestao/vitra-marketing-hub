# Atualizacao 2026-06-23 — Lançamento Premium (preto+dourado), só na marca Vitra Premium

> Versão Premium do Template 08, com a mesma densidade da v2 Imobiliária. Na `main`. Commit: **d200ad4**.

## Entregue
Família **`vitra-premium-lancamento`** (single_family) **no array Premium do catálogo** → aparece **apenas
na seção Vitra Premium** do Tráfego Pago (o modal filtra por `selectableCreativeTemplatesForBrand(scope)`).
Mesma estrutura densa do Lançamento Imobiliária, na linguagem Premium: foto hero + **painel preto
institucional** + selo dourado + headline + destaque dourado + 3 diferenciais com setas + "A partir de"/preço
+ CTA "Entrar na lista VIP". Voz de alto padrão (exclusividade, curadoria).

## Como o motor SVG-direto passou a servir Premium (antes era gated p/ Imobiliária)
- `buildVitraLancamentoSvg` virou **brand-aware**: Premium = bg preto + painel preto→dourado + wordmark
  **VITRA PREMIUM** (com "PREMIUM" dourado); Imobiliária = painel azul→navy + wordmark VITRA.
- Novo conjunto `PREMIUM_DIRECT_SVG_FAMILIES` + helpers `isDirectSvgTemplateKey`/`usesDirectSvgTemplate`;
  `modelKey`, o roteamento (`useApprovedVitraTemplate`), o dispatch e `maxTemplateImages` reconhecem a family.
  `brandScopeFor` já resolve premium (a family não é imob-key) → paleta correta.
- Sem `renderVersion` (template novo, sem assets antigos a re-renderizar) → guard de render-version intacto.
- Guard test: Premium passou de 1 → 2 templates (auto-editorial segue o default sem recipes).

## Verificação (ao vivo)
deno check + lint + **164 testes** + build; deploy CLI. 3 formatos renderizados (assets temporários Premium,
removidos depois): 1:1 conferido — wordmark "VITRA PREMIUM" completo (corrigi a viewBox que cortava "PREMIU"),
selo PRÉ-LANÇAMENTO, headline, destaque dourado, 3 setas, "A partir de R$ 1.890.000,00", CTA Lista VIP. 6
previews (sem+com moldura) em public/generated/vitra-premium.

## Comparação
Equivalente à v2 Imobiliária em densidade/hierarquia/estratégia, com identidade Premium (preto+dourado,
sem azul) e voz de exclusividade. Aparece só na marca Premium, como pedido.

Ver [[Atualizacao_2026-06-23_Template_08_Lancamento_v2_Redesign]].
