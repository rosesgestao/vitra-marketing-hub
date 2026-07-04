# Onda 4 — split (6): PublishMetaPanel sai do monólito + PAUSA para validação — 2026-07-04

Maior componente do Tráfego extraído. Fecha a leva de split de componentes desta sessão; **pausa aqui**
para o Leonardo validar os 3 componentes no ar antes de seguir.

## Feito (`567d9df`, no ar)
`components/PublishMetaPanel.jsx` (~700 linhas) — o painel "Revisar e publicar" inteiro: geo/raio,
direcionamento detalhado, plataformas/posicionamentos, públicos custom/lookalike, orçamento, `build_draft`
PAUSED e "ativar" com confirm. **Extraído por script** (fatia de linhas, sem transcrição manual → zero
risco de cópia). Dependências eram todas imports; PLATFORM_META + handlers são internos e foram junto.
Limpados **22 imports órfãos** no view + `assetPublishReady`. O `window.confirm` "Ativar (gastar)" intocado.
Verificação: lint **no-undef passa** (nenhum import removido era necessário) + 278 testes + build.

## Panorama da Onda 4 (split do PremiumDashboard.jsx)
| | Linhas |
|---|---|
| início | 5.655 |
| agora | **4.320** (−1.335, **−24%**) |

Módulos criados: `lib/metaAdReadiness.js` + `lib/metaAds.js` (puros, **38 testes de guarda**) ·
`lib/errorMessage.js` · `components/StatusPill.jsx`, `Field.jsx`, `MetaAdCard.jsx`, `AdEditModal.jsx`,
`PublishMetaPanel.jsx`. Splits 1–6: commits `766ea5a`, `2855115`, `022af10`, `4158303`, `c877d26`,
`567d9df`.

## PAUSA — checklist de validação do Leonardo no ar (vitrapremium.com.br)
Os splits de componente são **verbatim** (o build prova montagem/fiação, não o visual). Conferir:
1. **PublishMetaPanel** (o crítico): Tráfego → campanha → "Revisar e publicar" → conta/página/orçamento/
   destino aparecem; Localização (geo/raio) funciona; "Opções avançadas" abre (direcionamento, plataformas,
   públicos); **"Criar rascunho na Meta"** cria o rascunho PAUSED; "Ativar" pede confirm.
2. **MetaAdCard**: o card do anúncio mostra miniaturas dos 3 cortes, QA acionável, aprovar/baixar/editar.
3. **AdEditModal**: "Editar anúncio" abre, "Gerar 3 ângulos" funciona, salvar re-enfileira.

## Próximo (após validação)
Se tudo ok: `NewCampaignModal` (~700 linhas, o último grande — na aba de criação). Se algo destoar:
ajustar o componente extraído. [[Atualizacao_2026-07-04_Onda4_Split_Componentes_1]]
[[Atualizacao_2026-07-04_Onda4_Split_Helpers_Meta]] [[deploy-hostinger-vitrapremium]]
