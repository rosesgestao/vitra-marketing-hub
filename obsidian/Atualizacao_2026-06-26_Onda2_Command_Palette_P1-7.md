# Onda 2 (P1.7) — Command Palette / busca global ⌘K (2026-06-26)

Segundo passo do roadmap da auditoria ([[Atualizacao_2026-06-26_Auditoria_UX_IA_Dashboard]]), com a lente
da skill `ui-ux-pro-max` (combobox/listbox, navegação por teclado). Resolve o P1.7: antes a navegação era
só accordion (muitos cliques para achar uma tela); agora qualquer tela está a **um atalho** de distância.

## Entregue
- `lib/commandFilter.js` (+ teste): filtro PURO, normaliza acentos (PT) — "metricas" acha "Métricas",
  "trafego" acha "Tráfego" — e casa multi-termo (AND) sobre label + grupo.
- `components/CommandPalette.jsx`: overlay acessível (reusa `.modal-overlay/.modal-panel`). Input
  `role="combobox"` (aria-expanded/controls/activedescendant) + `role="listbox"` de resultados
  (`role="option"` + aria-selected). Setas ↑/↓, Enter seleciona, **Esc global** (robusto, não depende do
  foco), foco vai pro input ao abrir e **volta ao gatilho** ao fechar, scroll do body travado.
- `App.jsx`: atalho global **⌘K / Ctrl+K** (toggle), botão "Buscar telas… ⌘K" no topo da sidebar
  (descoberta), e itens derivados da navegação (`COMMAND_ITEMS` = toda view + título da seção como grupo,
  desambiguando "Conteúdo"/"Tráfego Pago" das duas marcas). Seleção chama `navigate` (roteador por hash da
  Onda 1) → deep-link + histórico funcionam.

## Verificação (DOM real, preview)
- ⌘K **abre** (input focado) e mostra as **20 telas**; botão da sidebar também abre.
- Digitar "metric" **filtra** para "Métricas" (sem acento); **Enter navega** → `#/metricas` e **fecha**.
- Sequência limpa: fechado → ⌘K abre → **Esc fecha** (handler global) ✓.
- lint limpo · **182 testes** (5 novos do commandFilter) · build OK.

## Estado do roadmap
Onda 1 (P0) ✅. Onda 2 (P1): **P1.7 ✅**. Restam: P1.1 (telas acionáveis/drawer), P1.2 (geradores órfãos),
P1.3 (copy IA unificada), P1.4 (desmonte do monolito), P1.5 (responsividade tablet), P1.6 (loop de
métricas). Sem back-end, sem mudança de identidade.

Commit: commandFilter (+teste) + CommandPalette + App (⌘K + botão + itens).
