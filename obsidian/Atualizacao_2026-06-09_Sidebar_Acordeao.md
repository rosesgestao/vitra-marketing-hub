# Atualizacao 2026-06-09 — Sidebar em acordeão (uma seção aberta por vez)

> Continuacao de [[Atualizacao_2026-06-09_Rebrand_Imobiliaria_e_Rename_Vitra_Marketing_Hub]]. Ajuste de UX na
> navegacao lateral: os grupos da sidebar deixaram de ficar todos abertos ao mesmo tempo. Agora cada titulo de
> secao e um cabecalho clicavel e **so uma secao fica expandida por vez** — a da view ativa. Na `main`,
> pushado. Commit: **ec42c30**.

## Por que
Os 4 grupos (Vitra Imobiliaria, Vitra Premium, Estudio de Pecas, Operacao compartilhada) renderizavam TODOS
os itens sempre abertos, poluindo a sidebar e dificultando a leitura. Pedido do usuario: navegacao mais limpa
e intuitiva — abrir um menu deve recolher os demais automaticamente.

## O que mudou (`dashboard/src/App.jsx`)
- **Modelo unico `NAV_SECTIONS`**: unifiquei os 4 grupos (marcas + pecas + operacao) numa lista com
  `id`/`titulo`/`itens`, preservando a ordem (marcas primeiro).
- **Componente `NavSection`**: cada secao vira um cabecalho clicavel (`<button aria-expanded>` + chevron); os
  itens so renderizam quando a secao esta aberta (sem itens-fantasma focaveis quando recolhida).
- **Estado `openSection`** (uma por vez): clicar num cabecalho abre aquela secao e recolhe as outras (toggle —
  clicar de novo recolhe). Um efeito sobre `view` reabre a secao DONA da view ativa a cada navegacao (inclusive
  navegacao programatica, ex.: Estudio de Pecas) — entao clicar num item mantem a propria secao aberta e fecha
  as demais.
- **Helper `sectionIdForView`** mapeia view -> secao. O chevron rotaciona e o titulo ganha tom dourado para
  sinalizar a secao ativa mesmo recolhida.

## Verificacao
- Lint limpo, **148 testes** verdes, build OK.
- 3 estados conferidos em preview (porta 5180, screenshots): inicial (so Imobiliaria aberta) -> clique no
  cabecalho Premium (Premium abre, Imobiliaria recolhe, view de fundo inalterada) -> clique no item Painel
  Premium (navega + re-tinge para o tema Premium preto/dourado SEM azul + mantem Premium aberto). Separacao de
  marcas do rebrand preservada.

## Estado
Navegacao lateral mais limpa: uma secao aberta por vez, sempre a da tela atual. Sem mudanca de dados ou rotas
— apenas o comportamento de expand/collapse da sidebar. (Config local de preview em `.claude/launch.json`,
porta 5180, fora do versionamento.)
