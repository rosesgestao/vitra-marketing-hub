# Descrição do anúncio Meta nunca vazia na semeadura (destrava "Criar rascunho na Meta") (2026-07-03)

## Sintoma
Tráfego Pago: com os 3 anúncios já APROVADOS e renderizados, o botão "Criar rascunho na Meta" seguia
bloqueado: "falta aprovar ao menos 1 criativo com título, texto principal, **descrição** e CTA". No QA de
cada anúncio, só "Descrição" ficava pendente (relógio).

## Causa-raiz
Na semeadura dos assets meta_ads (`buildAssetPayloads`), `meta_ad.descricao` vinha só de `form.tagline`
(`descricao: cleanText(form.tagline) || null`) — enquanto `texto_principal` era composto de fatos por
`buildAssetCopy`. Sem tagline, a descrição nascia **null**. O anúncio podia ser aprovado assim mesmo (o
botão "Aprovado" do card não exige descrição), mas o gate do build_draft exige
`metadata.meta_ad.descricao` não-vazio (premiumData `publishableAssets`, linha ~3073) → travava.

## Fix
- **`buildAssetDescription(form, brandProfile)`** (novo): 1 linha de reforço derivada dos fatos —
  tagline do operador; senão os 3 primeiros diferenciais + área/suítes juntados por " · "; último caso,
  linha institucional por marca. Nunca vazio.
- Semeadura passa a usar `descricao: buildAssetDescription(form, brandProfile)`. O operador reescreve no
  "Editar anúncio" (ou via "Gerar 3 ângulos" → Aplicar, que já gravava d.description).

## Estado atual (Flow MGF) — backfill
Os 9 assets checklist-rail já aprovados tinham descricao=null. Backfill via SQL com a MESMA lógica (3
primeiros diferenciais): lazer="Coworking · Espaço Fitness · Pet Place", planta="Espaço Fitness · Pet
Place · Piscina", preço="Bicicletário · Coworking · Espaço Fitness". Derivado dos próprios dados,
revisável, nada publica (rascunho PAUSED + confirm). Atualizar a página libera o botão.

## Verificação
240 testes + lint + build OK. Fix forward vai ao ar no rebuild da Hostinger; o backfill já está no banco.
[[deploy-hostinger-vitrapremium]] [[meta-ads-publicacao]]
