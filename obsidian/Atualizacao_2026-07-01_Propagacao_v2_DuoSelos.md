# Propagação v2 — duo-selos (2026-07-01)

2ª família migrada (depois de [[Atualizacao_2026-07-01_Propagacao_v2_HeroChecklist|hero-checklist]]).
Arquétipo diferente: **centrado** (feed/story) / coluna-esquerda (wide), foto-forward (2 fotos + 2 selos).

## 2 bugs reais achados no render (não era "só faltar regra")
1. **priceChip com texto sobreposto.** Usava offsets FIXOS (`x+70`, `x+160`…) com anchor central → os
   rótulos "De/Por" **colavam nos valores** quando o preço era largo ("DeR$ 629.000,00"). Reescrito
   **medido + centralizado**: mede cada segmento (rótulo+valor), distribui left→right com divisor,
   centra no pill e **encolhe junto** se não couber. Sem sobreposição.
2. **Selo truncado com `|`.** `productDifferentials` dividia só em `[\n;,]` → "Entrada facilitada|Pronto
   pra m…" (1 selo) + fallback "Bom Fim". Fix: aceita `|` → 2 selos corretos.

Os dois são helpers **COMPARTILHADOS**: o template base **dual-photo** também melhorou (ramo "Por:"
centrado, diferenciais divididos) sem quebrar — verificado com render real.

## v2 declarado (arquétipo centrado/foto-forward)
- **logo** (`requireLogo`), headline, pill, os **2 selos** com `charLimit` (reprova em vez de truncar),
  CTA. **Sem** regra de eixo (não é left-anchored) nem de fill do pill (conteúdo variável, auto-encolhe).
- `runCreativeLint` passou a aceitar `opts` (p/ requireLogo etc. nas famílias que usam o helper).
- render-version duo-selos v1→v2 (+ guard test).

## Verificação
Harness duo-selos **3 formatos verdes**; base dual-photo render limpo; harness completo feed+wide
**24/24**; 202 testes + ESLint OK. Cortes de inspeção removidos.

## Placar
oferta-ancora ✅ · hero-checklist ✅ · **duo-selos ✅**. Restam: hero-panel, lancamento, vitrine,
oportunidade-bairro, ficha-imovel, destino-bairro (no gate base). Padrão recorrente: **o split `|` e o
priceChip eram bugs de fábrica** que afetavam várias famílias — a propagação está limpando a base toda.

Commit: duo-selos v2 + priceChip medido + split `|`. [[render-asset-deploy-e-limites]]
