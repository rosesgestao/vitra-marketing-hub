# Etapa 6 (increment 1) — harness expandido (curto/vazio) + 3 bugs de robustez (2026-07-02)

Começo da Etapa 6 pela cobertura de MAIOR retorno de proteção: fixtures de conteúdo **curto** e **vazio**
(fallbacks) para as 6 selecionáveis — o cenário real que mais quebra em produção e que não era testado.
Resultado imediato: **o harness pegou 3 bugs reais** que eram invisíveis.

## Bugs revelados e corrigidos na FONTE
1. **duo-selos / vazio — `char_limit:selo1`**: sem diferenciais, o selo cai em `pd.location`, que pode
   passar de 30 (ex.: "Bairro Petrópolis, Porto Alegre" = 31). Fix: `productDifferentials(...).map(b =>
   compactText(b, 30))` — o selo nunca excede seu slot (== charLimit do schema).
2. **hero-checklist / curto / wide — `dead_gap:115>90`**: headline de 1 linha flutuava no topo com uma
   faixa morta enorme antes do preço (o layout wide assume ~2 linhas). Confirmado no render. Fix: **shift
   adaptativo** — sobe o cluster preço/checklist em `(2 - linhas)*headGap` quando a headline é curta;
   feed/story e wide-2-linhas: shift 0 (inalterados). Re-render confirmou a faixa morta eliminada.
3. **ficha / vazio / wide — `safe_zone:feature`**: com 4 diferenciais (do brief), o 4º tile quase saía da
   safe-zone do banner curto. Fix: `slice(0, isWide ? 3 : 4)` — o wide só cabe 3 tiles. (o `overflow:
   headline` do fixture era headline de 25 chars no wide apertado → fixture ajustado p/ 19, já que "vazio"
   testa DADOS ausentes, não headline longa.)

## Verificação
Harness das 5 famílias **9/9** cada (curto/medio/vazio × 3 formatos) — antes 3 falhavam. Render do
hero-checklist curto/wide inspecionado (equilibrado). deno check + **237 testes** + ESLint OK. Deploy CLI.
Os fixes só mudam CASOS-LIMITE (selo>30, headline 1-linha no wide, 4 features no wide); conteúdo `medio`
(o dos previews) é **byte-idêntico** → sem bump de versão, sem regenerar preview.

## Estado da Etapa 6
increment 1 (curto/vazio + 3 fixes) ✅. Restam: **preços de extensões diferentes**, **imagens H/V/
quadrada**, **Premium no harness** (outro caminho de render — Satori), **baseline de métricas** (comparar
com valores golden além de `ok`). Cada um é um increment.

## Estado da spec
Etapas 1-5 ✅ · 8 guard ✅ · **6 (parte)** ✅. Resta 6 (mais cobertura), 7 (regressão visual golden), 8
(docs). [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
