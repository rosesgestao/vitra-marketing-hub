# UX — Catálogo de Templates (Nova campanha): preview COMPLETO sem corte + cards premium — 2026-07-06

Melhoria pontual pedida pelo Leonardo (com print do corte): no modal **Nova campanha** (Tráfego Pago), as
prévias dos templates apareciam **cortadas**. Trabalho conduzido sob a lente `ui-ux-pro-max` (a pedido
explícito), mas com a **identidade Vitra** como autoridade (navy + dourado).

## Causa raiz do corte
O card era **horizontal**: `grid grid-cols-[118px_1fr]` — coluna fixa de **118px** para a imagem — e o
preview usava **`object-cover`**, que **preenche a caixa e corta o excesso**. Como os criativos têm
proporções variadas (1:1, 9:16, 1.91:1) numa caixa estreita, a peça era recortada → só se via um pedaço.

## Solução (1 arquivo: `dashboard/src/components/NewCampaignModal.jsx`)
- **Card horizontal → vertical premium** com a **imagem-herói no topo** (comparável entre modelos).
- Novo componente **`TemplatePreview`**: **`object-contain`** num **frame `aspect-[4/3]`** padronizado, com
  **padding** (respiro) e **fundo neutro** (`--surface-0`) → criativo **inteiro, sem corte**, na proporção
  original. **Skeleton** (pulse) no load, **`loading="lazy"`**, **fallback** (logo da marca) em prévia
  ausente/erro (`onError`), `alt` descritivo.
- **Seleção clara** (regra *color-not-only*): borda dourada + **selo "Selecionado"** com **ícone + texto**
  (não só cor) + `aria-pressed` + `focus-visible` ring.
- **Responsivo:** `grid-cols-1` (cel) → `sm:grid-cols-2` (tablet) → `xl:grid-cols-3` (desktop).
- **Ampliado:** reaproveitada a seção de prévias de referência abaixo do catálogo (já mostra os **3 formatos
  completos** do template selecionado em `object-contain`) — evita modal-sobre-modal e botão-dentro-de-botão.

## Fora de escopo (intocado, conforme pedido)
Regras de criação, **dados dos templates**, **lógica de seleção**, formatos disponíveis, integrações, fluxo
de salvamento e as demais seções do modal.

## Verificação
`lint` limpo · **278/278** testes · `build` ok. A tela fica **atrás do login** → o preview automatizado não
a alcança; a validação visual final é do Leonardo no ar. Commit `5f44a52` (push com OK explícito).

[[Atualizacao_2026-07-04_Auditoria_FaseC_Fecho_PremiumDashboard]]
