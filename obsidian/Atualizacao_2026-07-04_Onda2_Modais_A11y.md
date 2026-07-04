# Onda 2 (parte 3) — modais de edição do PremiumDashboard migrados para <Modal> (a11y) — 2026-07-04

Sequência de [[Atualizacao_2026-07-04_Onda2_Input_Select_TypeScale]]. Incremento (3) da Onda 2: adotar o
primitivo `<Modal>` nos overlays crus do PremiumDashboard — o maior ganho de acessibilidade.

## Feito
- **AssetEditModal** e **AdEditModal** migrados de `<div className="modal-overlay">…</div>` cru para o
  primitivo **`<Modal>`**. Ganham foco-preso (Tab cicla dentro), **Esc fecha**, **scroll-lock** do body,
  **restauração de foco** ao gatilho e `role="dialog"`/`aria-modal` — que o overlay cru não tinha.
  Estrutura preservada: o `<form>` (com seus próprios botões Cancelar/Salvar) vira o corpo do Modal; o
  Modal provê overlay/painel/header(título+close)/scroll. `open` fixo (o pai já renderiza condicional).

## Deferido (com razão)
- **NewCampaignModal** (1.100 linhas, footer com erro+submit) e o **drawer** lateral (`fixed inset-0
  justify-end`, linha ~2150) NÃO foram migrados às cegas — o risco sem teste visual (parede de login) é
  alto e o NewCampaignModal casa melhor com o **wizard da Onda 3** + o **split do arquivo (Onda 4)**. O
  drawer deve ir para o primitivo `<Drawer>` num passo dedicado.

## Verificação
Nas edições estruturais de JSX, o build compilar por completo é a prova de balanceamento: **build 1558
módulos OK · 240 testes · lint limpo**. No preview (HMR), o erro visto foi intermediário (arquivo
momentaneamente desbalanceado no meio das 4 edições); após o reload o Vite reconectou limpo e o React
montou (app renderiza). Vai ao ar no rebuild.

## Restante da Onda 2
NewCampaignModal → wizard (Onda 3); drawer → `<Drawer>`; 222 `text-[Npx]` do PremiumDashboard → sub-escala;
selects nativos → `<Select>`. [[deploy-hostinger-vitrapremium]]
