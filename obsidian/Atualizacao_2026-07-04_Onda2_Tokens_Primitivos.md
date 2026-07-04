# Onda 2 (parte 1) — tokens de sistema + primitivos Button/Badge — 2026-07-04

Sequência da auditoria [[Atualizacao_2026-07-04_Auditoria_UX_UI_Dashboard]] (Onda 2 = tokens antes de
componentes). Incremento seguro e verificável; não mexe em comportamento existente.

## Tokens (aditivos no `:root`, herdados também pelo tema Premium)
- **Escala de z-index nomeada** `--z-nav:40 / --z-overlay:50 / --z-command:60 / --z-toast:80` — mesmos
  valores já em uso (scrim<overlay<copiloto<toast); só centraliza e documenta as camadas, sem mudar ordem.
  Aplicada em `.modal-overlay` e no Toast (antes `z-50` / `z-[80]` mágicos).
- **Sombras** `--shadow-sm/md/lg` (valores canônicos dos cards/modal).
- **Cores semânticas de estado** `--color-success/warning/danger` — SEPARADAS do dourado da marca (o
  accent nunca vira estado).
- **`--text-muted`** rgba(255,255,255,.70) — texto secundário calibrado AA (fecha o contraste na fonte).

## Primitivos React (o que faltava — antes havia só classes CSS)
- **`<Button variant size loading icon>`** (`components/ui/Button.jsx`): variantes gold/ghost/subtle/danger,
  encapsula `.btn-gold`/`.btn-ghost` (visualmente idêntico; utilities vencem as classes .btn-* por virem
  na layer posterior no cascade). Estados loading/disabled + `aria-busy` consistentes.
- **`<Badge tone>`** (`Badge.jsx`): neutral/gold/success/warning/danger sobre a classe `.badge`.
- Exportados de `components/ui/index.js`.

## Adoção (dogfood — não deixar virar "ilha")
- `<Badge tone="neutral">` nos brand-badges do **Kanban** e **Calendário** (que criei na Onda 1).
- `<Button>` na **Biblioteca**: upload (gold), Cancelar (ghost), Excluir (danger) — as 3 variantes provadas.

## Verificação
lint limpo · **240 testes** · build OK · app sobe sem erro no console (HMR). Vai ao ar no rebuild.

## Restante da Onda 2 (próximos incrementos)
Unificar `<Input>`/`<Select>` (VitraSelect × select.form-input); tokenizar a escala de tipo (311
`text-[Npx]`, 222 no PremiumDashboard); adoção ampla do `<Button>`/`<FormField>` no PremiumDashboard;
migrar os 12 overlays crus para `<Modal>`. [[deploy-hostinger-vitrapremium]]
