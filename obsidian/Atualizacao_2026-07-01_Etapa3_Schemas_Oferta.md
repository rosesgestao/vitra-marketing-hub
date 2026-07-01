# Etapa 3 (increment 1) — templateSchemas.ts + oferta schema-driven (2026-07-01)

Início da Etapa 3 (a maior/mais arriscada — a própria spec manda **uma família por vez sob harness**).
Princípio: **a posição de cada elemento é DADO (schema), não código no builder** — "o motor não decide
onde há regra". Fundação + 1ª família (oferta-ancora), byte-idêntico.

## Entregue
- **`_shared/templateSchemas.ts`** (novo): tipos `Archetype`, `FieldSpec {charLimit, fallback, priority}`,
  `LintProfile`, `TemplateSchema {id, family, archetype, components{required,optional}, fields, lint,
  approvedVariants, dsVersion}`. `schemaFor(family)`. Para o **oferta**: `OFERTA_LAYOUT` (posições/
  tamanhos por formato — os MESMOS números que estavam inline, só relocados p/ dado + tipados via
  `OfertaLayout`) + `OFERTA_SCHEMA` (arquétipo left-anchored; componentes required/optional; campos
  headline charLimit 40 fallback derive / footnote 52 fallback hide; lint {priceMinRatio 1.6, axisTol 8,
  requireLogo}).
- **Builder do oferta** passou a **LER** do schema: `L = OFERTA_LAYOUT[kind]`; `footer` cap =
  `S.fields.footnote.charLimit`; headline lint `charLimit = S.fields.headline.charLimit`; opts de lint =
  `{ gapCap: L.gapCap, ...S.lint }`. O `L` inline (3 objetos por formato) saiu do código.

## Prova de output inalterado
Byte-diff SHA-1 render fresco × preview commitado, mesmos dados: **oferta 1:1 e 1.91:1 → IDÊNTICO**.
Refactor puro (relocação de dado), **sem bump de versão, sem regenerar preview**. deno check + 218 testes
(+5 do schema: schemaFor, arquétipo válido, campos charLimit>0, layout 3 formatos, contrato do oferta) +
ESLint OK. Deploy CLI.

## Decisão de modelagem (pragmática)
Guardei o layout como **px por formato** (não `rel` 0..1 sobre a safe) para ser **byte-idêntico** e
type-safe. A normalização para coordenadas relativas (que a spec cita) é um passo POSTERIOR e arriscado
(muda valores por arredondamento) — só faz sentido depois que todas as famílias estiverem no schema.
Cada família tem shape de layout próprio (as zonas diferem de verdade) → uma interface `*Layout` por
família (verboso, mas honesto).

## Próximo (mesma sequência, byte-idêntico)
Migrar as outras 5 selecionáveis ao schema (destino, hero-checklist, duo-selos, vitrine, ficha), uma a
uma: extrair o `L` para `templateSchemas.ts` + contrato de campos/lint + tokenizar o preço/CTA INLINE de
cada builder no mesmo passo (pendência marcada no passo 3 da Etapa 2). Depois: guard de sync
catálogo↔schema; e a Etapa 4 (lint v3: contraste real, token_conformance, format_divergence, gap
logo↔headline). [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
