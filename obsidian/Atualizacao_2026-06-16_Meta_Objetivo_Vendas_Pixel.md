# Atualizacao 2026-06-16 — Meta: objetivo Vendas / Conversoes (pixel)

> Ultimo objetivo do playbook destravado: **Vendas / Conversoes** (OFFSITE_CONVERSIONS), otimizando por
> evento do pixel. Na `main`. Commit: **b4f5f90**.

## Verificacao do pre-requisito (feita antes)
Pixels (datasets) das contas:
- **Imobiliaria (PoA `122035585232240`)**: **"Pixel Site Vitra Imobiliaria" `441583017395184` ATIVO,
  disparou 15/06/2026** (instalado no site). Outros (Golden Lake, San Mateo, Bella Citta) sao legados
  (ultimo disparo 2018-2021).
- **Premium (`1057868298461356`)**: NENHUM pixel -> Vendas em Premium nao roda ate ter um.

## Entregue
- **Playbook** `sales.available=true` (OUTCOME_SALES / OFFSITE_CONVERSIONS / WEBSITE / CTA SHOP_NOW;
  needs ['pixel']).
- **build_draft**: quando OFFSITE_CONVERSIONS, exige `pixel_id` que pertenca a conta (valida pela colecao
  `act_/adspixels` — o nó single nao expoe is_active de forma confiavel) + `conversion_event` (default
  LEAD; imovel raramente tem 'Compra'); monta `promoted_object:{pixel_id,custom_event_type}`. Sem pixel
  -> 422 `pixel_required`; pixel de outra conta -> 422 `pixel_invalid`.
- **manage-audiences**: nova acao `list_pixels` (`act_/adspixels`).
- **Front**: `buildMetaDraft` passa pixel/evento; `listMetaPixels`; `PublishMetaPanel` mostra seletor de
  **Pixel** (com botao Listar) + **Evento de conversao** (LEAD/CONTACT/SCHEDULE/COMPLETE_REGISTRATION/
  VIEW_CONTENT/PURCHASE) so no objetivo Vendas; `canBuild` exige pixel.

## Verificacao
deno check, lint, 151 testes, build OK; deploy. AO VIVO: list_pixels OK; sales sem pixel ->
`pixel_required`; pixel valido -> passa o guard (`no_approved_creative`); pixel de outra conta ->
`pixel_invalid`.

## Estrategia (nota)
OFFSITE_CONVERSIONS precisa do evento escolhido **disparando no site com volume** (~50/semana p/ sair do
aprendizado). Para imovel, otimizar por **Lead/Contato** rende mais que 'Compra'. O site precisa ter o
evento configurado no pixel.

## Estado dos objetivos (playbook completo)
Ativos: Reconhecimento, Trafego, Engajamento, Leads (clique), Leads (formulario), Conversas (WhatsApp),
**Vendas/Conversoes**. Pre-requisitos externos cumpridos (ToS de Lead, app publico, WhatsApp na Pagina,
pixel Imobiliaria). Resta para Vendas em **Premium**: criar/instalar um pixel naquela conta.

Continuacao de [[Atualizacao_2026-06-16_Meta_Objetivo_WhatsApp]]. Ver [[meta-ads-publicacao]].
