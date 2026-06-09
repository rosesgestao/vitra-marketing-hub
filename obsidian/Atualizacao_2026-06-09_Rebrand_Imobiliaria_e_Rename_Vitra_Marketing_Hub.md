# Atualizacao 2026-06-09 — Rebrand para a marca-mae (Imobiliaria) + rename para Vitra Marketing Hub

> Continuacao de [[Atualizacao_2026-06-09_Capas_Sociais_e_Estudio_de_Pecas]]. Duas viradas de
> posicionamento: (1) a identidade visual PRINCIPAL do dashboard passou de Premium (preto) para a
> marca-mae **Vitra Imobiliaria** (navy + dourado), com **tema dinamico por marca**; (2) o projeto foi
> renomeado de `vitra-premium-ferramenta-operacional` para **Vitra Marketing Hub** (`vitra-marketing-hub`).
> Tudo na `main`, pushado. Commits: **2cbcdc2** (tema) + **081d52f** (rename).

## Por que
A ferramenta nasceu Premium-only, mas a Vitra Imobiliaria passou a demandar mais da area de marketing.
O sistema virou uma **plataforma de marketing MULTI-MARCA com a marca-mae como principal** — e o nome
antigo ("premium-ferramenta-operacional") mentia sobre esse escopo.

## Rebrand — tema dinamico por marca (commit 2cbcdc2)
Regra dura preservada: **Premium = preto + dourado, SEM azul**. Solucao: o chrome re-tinge conforme a
marca ATIVA, com a Imobiliaria como padrao.
- **Variaveis de tema** (`--bg-base`, `--surface-0/1/1-hover/2`, `--line`, `--app-gradient`) definidas por
  marca em `index.css`, selecionadas por `data-brand` no `<html>`: `:root`/imobiliaria = navy (padrao),
  premium = preto. Dourado e compartilhado. Componentes consomem via `bg-[color:var(--surface-N)]` + `.card*`.
- **App.jsx**: `data-brand` = marca ativa (fallback padrao = imobiliaria); **default view = imobiliaria**;
  sidebar reordenada (Imobiliaria primeiro); sidebar/avatar via `var(--surface-0)`; root sem `bg-black` forcado.
- **6 views** (PremiumDashboard, Metricas, Kanban, Calendario, Agentes, Pipeline) migradas para as vars;
  **contraste corrigido** (`text-navy-600`/`gray-600` ilegiveis no navy -> legiveis; chips/divisores
  near-black -> white-alpha/dourado). `index.html`: titulo neutro, `theme-color` navy, favicon V Imobiliaria,
  e script SINCRONO de `data-brand` (mata o flash de navy ao restaurar um painel Premium).
- **Separacao de marcas**: recolori o unico azul-de-chrome que vazava no Premium (`#8EC4F0` em 2 stat-tiles
  -> dourado). O azul restante e so do logo Imobiliaria (gated por scope) e cores de plataformas terceiras
  (Facebook etc.).
- **Verificacao**: 3 estados conferidos por screenshot (Imob navy / Premium preto-sem-azul / views
  compartilhadas navy). Revisao adversarial (workflow, 3 frentes): separacao de marcas = **PASS**; achados
  de contraste/superficie corrigidos. Build + lint + **148 testes** verdes.

## Rename — Vitra Marketing Hub (commit 081d52f)
Nomenclatura ancorada em `vitra` (guarda-chuva que cobre Imobiliaria E Premium — escapa de travar num
sub-escopo, o mesmo erro do "premium" no nome antigo):

| Superficie | Nome |
|---|---|
| Projeto / Cofre Obsidian | Vitra Marketing Hub |
| Diretorio / Repo GitHub | `vitra-marketing-hub` |
| Supabase | `Vitra Marketing Hub - Producao` |

Feito:
- **Repo GitHub renomeado** `vitra-premium-ferramenta-operacional` -> `vitra-marketing-hub` (`gh repo rename`;
  o GitHub redireciona URLs/clones antigos). **Remote local atualizado.**
- **README reescrito** para a identidade multi-marca; **CHANGELOG** e o [[Ferramenta Operacional Premium/00 - Indice]]
  apontam para o novo nome/URL. Notas historicas do cofre preservadas (sao snapshots).

## Pendente (manual; bloqueado por lock enquanto a pasta/sessao estao abertas)
- **Diretorio local** -> `vitra-marketing-hub` (cosmetico; nada quebra se ficar pra depois). O VS Code + o
  Claude Code seguram a pasta (Windows recusa o rename). Script pronto FORA da pasta:
  `D:\LEONARDO\Vitra\renomear-projeto-vitra-marketing-hub.ps1`. **ORDEM IMPORTA** — o transcript desta
  conversa so e finalizado quando a sessao FECHA, e o Claude Code acha o historico pelo CAMINHO da pasta:
    1. Fechar VS Code + esta sessao do Claude Code (+ terminais/dev server). So entao o `.jsonl` da sessao
       e finalizado na pasta antiga de historico.
    2. Rodar o script com tudo FECHADO. Ele (a) renomeia a pasta do projeto e (b) **copia a pasta INTEIRA de
       historico do Claude** (`~/.claude/projects/D--LEONARDO-Vitra-vitra-premium-ferramenta-operacional` ->
       `...-vitra-marketing-hub`): transcripts `.jsonl` + sessoes + `memory`. A pasta antiga fica como backup
       (nada e apagado).
    3. Abrir o Claude Code em `D:\LEONARDO\Vitra\vitra-marketing-hub` e usar `claude --resume` -> esta conversa
       e todo o historico aparecem no caminho novo.
  - Sem o passo 2, renomear NAO apaga nada, mas o historico ficaria "no disco, fora da lista" (o `--resume` no
    caminho novo nao listaria conversas antigas). O `.jsonl` e texto puro: sempre legivel direto da pasta.
- **Supabase**: FEITO em 2026-06-09 — label do projeto renomeado para `Vitra Marketing Hub - Producao`
  (confirmado via API). O `ref`/URL `birxcfkyuzqnhyvetbjv` **NAO mudaram** — `.env` e codigo intactos.

## Estado
A plataforma agora se apresenta como **Vitra Imobiliaria (marca-mae) por padrao**, com Premium disponivel
quando necessario, sem cruzar identidades. Frentes anteriores seguem: copiloto de IA, trafego pago, Estudio
de Pecas, e o render-worker dormente (diretriz local-first).
