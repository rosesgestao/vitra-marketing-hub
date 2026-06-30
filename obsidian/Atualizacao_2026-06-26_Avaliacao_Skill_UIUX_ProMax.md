# Atualização 2026-06-26 — Avaliação da skill ui-ux-pro-max (nextlevelbuilder)

Pedido: verificar se a skill do repo `nextlevelbuilder/ui-ux-pro-max-skill` está instalada/funcional no
projeto; avaliar conflito com `direcao-de-arte`/`frontend-design`; instalar (Opção B, branch isolada) e
validar funcionalmente.

## Estado inicial: NÃO instalada (ausente por completo)
Sem vestígio em `.claude/skills/`, `.claude/plugins/`, `~/.claude/skills/`, settings, nem no registro de
skills dos agentes. 0 ocorrências do nome no repo.

## Avaliação de conflito
- **× `frontend-design`: ALTO** — gatilhos quase idênticos (construir landing/dashboard/UI).
- **× `direcao-de-arte`: baixo** — domínio diferente (UI web vs peça de anúncio renderizada).
- **Governança de marca: médio-ALTO** — traz design system genérico (paletas/fontes próprias) que
  contradiz o brandbook Vitra (navy+dourado, Anton/Inter). Auto-ativa em pedidos amplos.

## Instalação isolada (npx, sem global, dir de avaliação) + validação funcional
- Pacote `ui-ux-pro-max-cli@2.10.0` existe no npm (criado 2026-06-26 — **4 dias**, muito novo → cautela
  supply-chain). `npx ... init --ai claude` rodou sem erro, escreveu só em `.claude/`, sem `uipro` global.
- **Achado crítico:** o `init` NÃO instala 1 skill — instala um **bundle de 8**: `ui-ux-pro-max`,
  `design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides`, `brand`. Vários colidem com
  o domínio/governança Vitra (`brand`, `banner-design`, `design-system`). 145 arquivos, ~3 MB.
- `SKILL.md` válido, mas `description` é **keyword-stuffing agressivo** (plan/build/create/design/review/
  fix/improve… × website/dashboard/SaaS/mobile…) → auto-trigger amplíssimo (alta colisão). Seção "When to
  Apply" vem em **chinês**.
- **TESTE FUNCIONAL: PASSOU.** `python .claude/skills/ui-ux-pro-max/scripts/search.py "beauty spa
  wellness" --design-system` → `EXIT=0`, devolveu design-system completo (pattern/style/cores/tipografia/
  efeitos). Output **genérico** (rosa/lavanda) — comprova o risco de marca. Python 3.13 presente (via
  `python`; `python3` inexiste no Windows → docs da skill chamam `python3`, ajuste de portabilidade).

## Decisão: validada em isolamento, NÃO promovida para o projeto vivo
Promover mudaria materialmente o escopo aprovado (1 skill → 8) e **comprometeria a arquitetura** (8 skills
auto-acionáveis competindo com nossas 4 Vitra + frontend-design; `brand`/`banner-design` contra a
governança de marca). Mantida fora do `.claude/skills/` do projeto. Branch de avaliação removida (vazia —
`.claude` é gitignored, então git branch não isola skill; a isolação real foi o dir de scratch).

## Recomendação (se promover)
- Escopar a **só `ui-ux-pro-max`** (não os 7 irmãos), via cópia manual do dir gerado para
  `.claude/skills/ui-ux-pro-max/` — não rodar o `init` direto no projeto (ele despeja os 8).
- Definir **precedência**: UI/UX da Vitra continua em `direcao-de-arte`/`frontend-design` (autoridade de
  marca); usar a ui-ux-pro-max só sob pedido explícito e fora do contexto de marca.
- Estreitar o `description` (auto-trigger) para reduzir colisão. Aliasar `python3`→`python` p/ os scripts.

Sem commit de código (nada versionado mudou). Esta nota documenta a avaliação.
