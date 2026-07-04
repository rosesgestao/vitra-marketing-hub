# Onda 4 — split de componentes (1): MetaAdCard + AdEditModal saem do monólito — 2026-07-04

Continuação do desmonte do `PremiumDashboard.jsx`. Depois dos helpers puros
([[Atualizacao_2026-07-04_Onda4_Split_Helpers_Meta]]), os primeiros componentes grandes saem para
arquivos próprios — cada um puxando junto as fundações compartilhadas que precisava.

## Splits (2 commits, refatoração pura, no ar)
- **split 4** (`4158303`): `components/MetaAdCard.jsx` (card do anúncio Meta) + `components/StatusPill.jsx`
  (pílula de status compartilhada, +STATUS_STYLES — usada em 9 lugares). AdField + META_QA_HINTS
  (exclusivos) vão junto. Removidos imports órfãos no view (AD_FORMAT_ORDER, META_PLACEMENTS).
- **split 5** (`c877d26`): `components/AdEditModal.jsx` (modal de edição do anúncio + porta da vitra-copy)
  + `components/Field.jsx` (campo rotulado, 31 usos) + `lib/errorMessage.js` (util, dezenas de usos) +
  CTA_OPTIONS (exclusivo do modal). Removido import órfão generateAdCopyAngles.

## Resultado
`PremiumDashboard.jsx`: **5.399 → 5.013 linhas**. Novos arquivos reutilizáveis: StatusPill, Field,
MetaAdCard, AdEditModal, errorMessage. 278 testes + build + lint verdes.

## Natureza (importante)
Diferente dos helpers puros (testáveis), componentes são **movimentos verbatim**: o build prova que
montam e que a fiação de imports resolve, mas **não** valida o visual. A conferência de que o card e o
modal aparecem/funcionam igual é teste do Leonardo no ar.

## Próximo
`PublishMetaPanel` (~700 linhas) — o maior e mais arriscado (muito estado/helpers internos: geo, públicos,
placements, build/ativar). Passo dedicado. [[Atualizacao_2026-07-04_Trafego_Pago_100_FECHADO]]
[[deploy-hostinger-vitrapremium]]
