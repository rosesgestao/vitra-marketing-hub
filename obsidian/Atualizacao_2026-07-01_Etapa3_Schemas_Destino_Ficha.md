# Etapa 3 (increment 2) — destino + ficha ao schema (2026-07-01)

Continua a [[Atualizacao_2026-07-01_Etapa3_Schemas_Oferta|Etapa 3]]: mais 2 famílias com posição/contrato
em DADO. **3 de 6 selecionáveis no schema** (oferta, destino, ficha).

## Padrão de migração (descoberto no increment 2)
Os `L` das famílias são heterogêneos (ficha tem objetos aninhados `feat`/`footer`, array misto
`gallery: [x,y,[..],w,r]`, e `footer: null` no wide). Escrever interface estrita para cada um é caro e
arriscado. **Solução:** mover o bloco `isStory ? {...} : isWide ? {...} : {...}` **VERBATIM** para uma
função `xLayout(isStory, isWide)` no `templateSchemas.ts` — o TS infere o MESMO tipo do ternário original
→ zero mudança de tipo, byte-idêntico, sem interface manual. (o oferta ficou como Record+interface; as
demais usam função — ambos válidos.)

## Entregue
- `templateSchemas.ts`: `destinoLayout()` + `fichaLayout()` (blocos verbatim) + entradas no registro
  `TEMPLATE_SCHEMAS`: **destino** (arquétipo `centered`; campos hero 18 / subtitle 88; lint {requireLogo})
  e **ficha** (arquétipo `left-anchored`; campo headline 30; lint {axisTol 8, requireLogo}).
- Builders de destino e ficha passam a **LER** do schema: `L = xLayout(isStory,isWide)`; caps de campo
  (subtitle/hero do destino, headline do ficha) e opts de lint vindos de `S = schemaFor(...)`. Os `L`
  inline saíram do código.

## Prova
Byte-diff SHA-1 render fresco × preview commitado: **destino 1:1 e 1.91:1 + ficha 1:1 e 9:16 → IDÊNTICO**.
Sem bump de versão, sem regenerar preview. deno check + 218 testes + ESLint OK; deploy CLI. (fix de tipo:
`schemaFor(...)!` no subtitle do destino — schemaFor é nullable.)

## Restam
3 selecionáveis: **vitrine** (left-anchored split) + **hero-checklist** e **duo-selos** (usam Poppins +
mais chaves + preço/CTA inline → tokenizar junto). Depois: guard de sync catálogo↔schema; Etapa 4 (lint v3).
[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
