# Atualizacao 2026-06-12 — Oculta os 4 templates antigos do modal Nova Campanha

> A pedido do Leonardo, a selecao de templates do modal **Nova Campanha** da **Vitra Imobiliaria**
> (secao Trafego Pago) passa a oferecer **apenas os 3 templates aprovados mais recentes**, porque os
> 4 primeiros nao ficaram bons. Na `main`, pushado. Commit: **e9e20af**.

## O que mudou
O modal agora lista somente:
1. **Foto de fundo com checklist** (New Life) — vira o **default** da selecao.
2. **Oferta duo com selos** (Zona Norte).
3. **Hero com painel e galeria** (San Clemente).

Os 4 antigos saem da lista: **Oferta com duas fotos** (dual-photo-offer), **Galeria com beneficios**
(patios-gallery), **Financiamento e oportunidade** (financiamento-orla) e **Oferta com foto
protagonista** (menino-deus).

## Como (sem quebrar nada do que ja existe)
Os 4 templates **nao foram removidos do catalogo** — ganharam `hidden: true`. Assim eles continuam
resolvendo por id (`getCreativeTemplateById`, render no Edge, render-version), entao qualquer
campanha/asset ja criado com essas families segue funcionando e renderizando. Eles so deixam de
aparecer na **selecao** do modal.

- `creativeTemplateCatalog.js`: flag `hidden` nos 4 + nova funcao `selectableCreativeTemplatesForBrand`;
  `defaultCreativeTemplateForBrand` passa a apontar para o primeiro **selecionavel** (hero-checklist).
- `PremiumDashboard.jsx`: o picker do modal usa a lista selecionavel.
- `premiumData.js`: a sugestao de template por IA tambem so considera os selecionaveis.
- Testes: guarda nova (3 selecionaveis na ordem certa; os 4 ocultos ainda resolvem por id) e ajuste
  dos contadores que dependiam do template default (o hero-checklist expoe 6 angulos). **151 testes
  verdes, lint limpo.** Verificado no preview do navegador: o modal lista exatamente os 3.

## Estado
Catalogo segue com 7 templates da Imobiliaria (4 ocultos + 3 visiveis). Para reativar qualquer um,
basta remover o `hidden: true`. Continuacao de [[Atualizacao_2026-06-12_Template_07_Hero_Panel_San_Clemente]].
