# Atualizacao 2026-06-11 — Safe zone no "Oferta com duas fotos" + Template 06 (duo + selos)

> Continuacao de [[Atualizacao_2026-06-11_Template_05_Estudio_Criativos_Excluir_Campanhas]]. Duas frentes:
> (1) auditoria e correcao da margem de seguranca do template **Oferta com duas fotos** usando a skill
> `margem-seguranca-criativos` (criada nesta mesma data, commit **8bfc960**); (2) **Template 06 — Oferta duo
> com selos**, fiel a peca original da campanha Zona Norte, com safe zone nativa. Na `main`, pushado.
> Commits: **8bfc960** (skill), **4284748** (safe zone dual), **e3112fa** (template 06). Edge no deploy **v56**.

## 1. Skill `margem-seguranca-criativos` (commit 8bfc960)
Nova skill em `.agents/skills/` (versionada) com as safe zones do Meta por placement (feed 1:1/4:5/paisagem,
Stories e Reels 9:16) mapeadas para os 3 formatos da Vitra. Inclui `references/safe-zones.json`
(machine-readable: px/%/safeRect/cssPadding) e 4 overlays SVG de conferencia visual. Regra de ouro do 9:16:
projetar para REELS (topo 250 / base 450 / laterais 35 + canto inferior direito livre) — cobre Story tambem.
Cross-reference adicionada na skill local `gerar-criativo` (fora do git, `.claude/` e ignorado).

## 2. Safe zone aplicada ao "Oferta com duas fotos" (commit 4284748)
Auditoria do `approvedTemplateLayout` (textFit.ts) contra a skill encontrou violacoes reais:
- **1:1**: logo em y=78 (precisa >=108).
- **9:16**: logo em y=110 (zona do avatar) e o rodape inteiro — features (1580/1635), CTA (1708) e slogan
  (1830) — na faixa coberta pela UI de Story/Reels.
- **1.91:1**: logo em (70,50) (precisa >=89,63) e CTA terminando em 583 (precisa <=564).

Correcao nas coordenadas (fonte unica Edge+Vitest): 1:1 logo y=110; **9:16 reels-safe** com tudo entre
y=250 e 1470 (fotos menores 2x 810x232 abrem espaco para features+CTA); 1.91:1 logo (89,63) e CTA <=564.
Validado com render real (v55) nos 3 formatos. Sem bump de render-version (decisao: nao re-renderizar
retroativamente as pecas ja geradas; novas campanhas ja saem seguras).

## 3. Template 06 — "Oferta duo com selos" (commit e3112fa)
Sexto template aprovado da Imobiliaria, **fiel a peca original da Zona Norte**
(`criativos-aprovados-vitra-imobiliaria/2fe17ff8` feed e `f38e4f2b` story) — a mesma referencia que inspirou
livremente o dual-photo, agora reproduzida de fato: composicao centralizada, wordmark VITRA branco, headline
2 linhas (2a dourada), **pill branco De/Por** (reaproveita o `priceChip`), duas fotos grandes lado a lado
**sem moldura**, dois **selos badge-check** e **CTA pill**. Nos 3 formatos x sem/com moldura.

- **Paleta 100% brandbook**: azul-royal e amarelo da referencia viram navy + dourado (GOLD no CTA,
  GOLD_LIGHT nos selos/2a linha) — mesma regra do Template 05.
- **Safe zone nativa**: 1:1 [108..972]; 9:16 reels-safe y[250..1470]; 1.91:1 x[89..1111] y[63..564].
- Catalogo: family `vitra-imobiliaria-duo-selos-offer`, 6 recipes, `renderVersion duo-selos-approved-v1`
  (+ espelho na Edge, guarda anti-divergencia no CI). Testes 5->6, **148 verdes**, deno check OK.
- Previews reais em `public/generated/vitra-imobiliaria/template-06-duo-selos-*` (6 PNGs, Edge v56, fotos
  reais da referencia). **Verificado no navegador**: modal Nova Campanha lista os 6 templates.

## Estado
Margem de seguranca agora e ativo de primeira classe: skill versionada + dual corrigido + templates 05/06
nascendo seguros. Pendencia conhecida: os templates patios-gallery, financiamento-orla e menino-deus ainda
NAO foram auditados contra a safe zone (mesmo metodo do dual se aplica). Working tree limpo, tudo pushado.
