# Atualizacao 2026-06-17 — IA do menu: organico x pago (refatoracao so de navegacao)

> Reorganizacao da sidebar por INTENCAO (presenca/organico vs demanda/pago), so em `App.jsx` — sem
> tocar na logica das telas nem no fluxo de Trafego Pago. Na `main`. Commit: **2e00915**.

## Antes
Marcas com "Painel" + "Tráfego Pago" (mesmo componente em focusMode); "Operação compartilhada"
misturava organico puro (Calendário, Conteúdos, Pipeline) com transversal (Agentes, Métricas). Naming
"Central…" duplicado (hero da tela, nao no menu).

## Depois (menu)
- **Vitra Imobiliária / Vitra Premium** — 2 pilares claros: **Conteúdo & Curadoria** (organico) +
  **Tráfego Pago** (pago). So relabel — `id`/`brandScope`/`focusMode` preservados.
- **Produção de conteúdo** (nova secao organica): Calendário, Conteúdos.
- **Estúdio de Criativos** / **Estúdio de Peças** — producao de artes (servem aos dois).
- **Inteligência & automação** (era "Operação compartilhada"): Agentes, Métricas = transversal.
- **Pipeline MESCLADO em Conteúdos**: saiu do menu (redundante com o quadro Conteúdos). Componente e
  o branch do renderizador (`view==='pipeline'`) seguem no codigo -> **reversivel** readicionando 1 item.
  Removido o icone `Zap` (nao usado).

## Garantias
SO `App.jsx` (navegacao/nomenclatura). Nenhuma view alterada; `publish-meta-ads` e o painel "Publicar na
Meta" intactos. `normalizeViewId` cai no default para views removidas (um 'pipeline' salvo no storage
volta para 'imobiliaria'). lint, 151 testes, build OK. Ao vivo: menu novo renderiza, Pipeline fora,
Tráfego Pago + seletor de objetivo funcionando.

## Pendencia de copy (fora deste escopo)
O hero interno das telas ainda diz "Central…/Central de Curadoria e Campanhas" (texto dentro da view,
nao no App.jsx). Alinhar essa copy ao novo menu e um ajuste a parte. Ver [[meta-ads-publicacao]].
