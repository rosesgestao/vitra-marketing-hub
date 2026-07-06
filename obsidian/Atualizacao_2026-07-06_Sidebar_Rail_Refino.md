# UX — Sidebar do dashboard: rail recolhível + foco/hover em CSS + perfil do usuário — 2026-07-06

Refino do menu lateral (shell) sob a lente `ui-ux-pro-max`, com a identidade Vitra como autoridade.
Sem tocar em auth, rotas, telas ou integrações — só o `App.jsx`.

## Problemas corrigidos
- **Hover via JavaScript** (`onMouseEnter/onMouseLeave` mutando `style`) → CSS `:hover` (cobre teclado/touch,
  sem estilo preso).
- **Sem anel de foco** → `focus-visible:ring` dourado em itens, seções, busca e toggles (a11y CRÍTICO).
- **Sem estado recolhido / tooltips** → implementado (era o maior gap pedido).
- **Rota ativa só por cor** → barra dourada à esquerda (forma; `color-not-only`).
- **Rodapé com ruído** (data fixa "Junho/2026", "Sistema ativo") e sem o usuário → **perfil do usuário**
  (inicial + nome + e-mail via sessão Supabase, read-only).
- **Sem lock de scroll** no drawer mobile → `body overflow hidden` enquanto aberto.
- Alvos de toque pequenos (X de fechar) → aumentados (≥44px).

## Estado recolhido (decisão do Leonardo: rail que expande ao clicar)
Toggle no topo, **persistido** (`localStorage: vitra-operational-dashboard.sidebar-collapsed`). Recolhido =
rail de ~76px com os **ícones das seções + tooltip** (`title`+`aria-label`); clicar num ícone
`setOpenSection(id) + setCollapsed(false)` (expande e abre a seção). Cada seção ganhou um `icon`. Mobile
inalterado (drawer sempre expandido; o `collapsed` só vale em `md+` via classes responsivas — dois subtrees,
visibilidade por CSS).

## Preservado
Logo brand-aware + re-tint, acordeão (uma seção aberta), `aria-current`/`aria-expanded`/`aria-label`,
busca ⌘K, deep-link por hash, drawer com overlay + fechar-fora + fechar-ao-selecionar. Botão **Sair**
(no `AuthGate`) intocado (logout garantido no mobile).

## Comportamento
Desktop/notebook/tablet: estático, expandido (288px) ↔ rail (76px), preferência lembrada, transição de
largura suave. Celular: drawer + overlay + fundo travado + safe-area.

## Verificação
`lint` limpo · **278/278** testes · `build` ok · preview sem erro de console/servidor. Shell atrás do
login → validação visual do Leonardo (OK dado). Commit `9053c9c` (push com OK).

[[Atualizacao_2026-07-06_Pagina_Inicial_Dashboard]]
