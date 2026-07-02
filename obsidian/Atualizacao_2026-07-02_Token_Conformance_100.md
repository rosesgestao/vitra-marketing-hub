# token_conformance 100% limpo — paleta estendida sancionada (2026-07-02)

Fecha o débito de marca INVISÍVEL (cores off-palette) de forma **byte-idêntica**: em vez de TROCAR as
cores (mudaria o pixel), OFICIALIZA-se a paleta que já é usada. Com a Poppins→Inter (feita antes), o
`token_conformance` (Etapa 4) fica **100% limpo**.

## Constatação
As cores fora do núcleo não eram erros — eram o vocabulário de **profundidade/degradê** (stops de
gradiente navy/dourado/preto, accents azuis da Imobiliária, near-whites/near-black de texto). Trocá-las
por tokens próximos mudaria o pixel; o certo (e o que o Leonardo pediu — byte-idêntico) é **sancioná-las**.

## Entregue
- **`DS_PALETTE_EXTENDED`** (novo, em `designTokens.ts`): 20 cores em uso real além do núcleo `DS_COLORS`,
  agrupadas e documentadas (near-whites+ink, pretos/profundidade, navies de degradê, accents azuis,
  stops dourados). Achado no caminho: 4 cores (#050C16/#0A1B32/#0E1D38/#13294C) JÁ estavam no núcleo
  (adicionadas antes) — removidas da estendida p/ não duplicar (teste pegou).
- **`render-asset`**: `TOKEN_COLORS` agora = núcleo `DS_COLORS` ∪ `DS_PALETTE_EXTENDED`. **Nenhum hex do
  render mudou** (só o conjunto que o `token_conformance` considera válido).

## Verificação (as duas coisas que o Leonardo pediu provar)
- **Byte-idêntico:** harness `hero-checklist` **9/9** — o golden visual (SHA) PASSA (o render não mudou 1
  byte; a paleta só afeta quais warnings são gravados, não o PNG). Baseline de métricas inalterado.
- **100% limpo:** rendei as 6 famílias (5 Imob + Premium) e li `metadata.lint.warnings` → **NENHUM
  `token_*` em todas** (nem cor nem fonte). O `token_conformance` não sinaliza mais nada.
- deno check + **238 testes** (+1: paleta estendida com hexes válidos/distintos/sem colidir com o núcleo)
  + ESLint OK. Deploy CLI.

## Estado
Núcleo da spec (etapas 1-8) ✅ + débito de marca (Poppins→Inter + cores sancionadas) ✅ → o gate de
conformidade de token está **verde de ponta a ponta**.

## Pendências que SOBRAM (não são token_conformance, não são byte-idênticas — decisão à parte)
- Estender o **contraste WCAG** às outras 5 famílias + sobre foto (raster).
- **format_divergence** (alerta) e promover **logo_crowding** a erro por arquétipo.
- Eixo de fixture **imagem H/V/quadrada** no harness.
- Governança documental (ciclo de vida do template / changelog do DS — esboço na spec §8).
[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
