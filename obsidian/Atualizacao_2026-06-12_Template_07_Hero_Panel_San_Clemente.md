# Atualizacao 2026-06-12 — Template 07 (hero + painel, San Clemente)

> Continuacao de [[Atualizacao_2026-06-11_Safe_Zone_Dual_e_Template_06_Duo_Selos]]. Setimo template
> aprovado da Vitra Imobiliaria, fiel a peca da campanha **San Clemente / Bairro Gloria**, com painel
> na familia azul do brandbook e safe zone nativa. Na `main`, pushado. Commit: **d2d1734**.
> Edge `render-asset` no deploy **v59**.

## O template
Referencia aprovada: `criativos-aprovados-vitra-imobiliaria/1040ccb5` (feed) e `83b3c406` (story).
Composicao: foto **hero** sangrando no topo + **painel azul** em degrade com headline em 2 linhas
(2a dourada) + **linha de destaque dourada** (ex.: "A 500m da 3a Perimetral"), **lista de setas**
douradas, "OPORTUNIDADE POR:" e preco; **galeria lateral** de 2 fotos sobrepondo hero e painel. Sem
CTA (fiel a referencia). Nos 3 formatos x sem/com moldura. **Verificado no navegador**: o modal Nova
Campanha lista os 7 templates.

- **Paleta 100% brandbook**: o painel usa a FAMILIA AZUL oficial da marca-mae (#2E6BB5 -> #1B3A6B ->
  navy) — diferente dos templates 05/06 que sao navy+dourado, mas ainda 100% dentro do brandbook
  (a familia azul e do "V" esquerdo da logo). O amarelo da referencia vira dourado (GOLD_LIGHT).
- **Safe zone**: 1:1 [108..972]; 9:16 reels-safe y[250..1470]; 1.91:1 x[89..1111] y[63..564].
- Catalogo: family `vitra-imobiliaria-hero-panel-gallery`, 5 recipes, `renderVersion
  hero-panel-approved-v1` (+ espelho na Edge). Testes 6->7, **148 verdes**, deno check OK.
- 6 previews reais em `public/generated/vitra-imobiliaria/template-07-hero-panel-*` (Edge v59).

## Nota de processo (importante)
O deploy via MCP exige o conteudo do Edge inline (~60KB). Durante esta sessao, ao reenviar apos um
timeout transitorio do bundler do JSR (`@std/encoding`), reescrevi o `index.ts` de memoria de forma
compacta e introduzi 2 regressoes na v58: (1) `LOGO_INNER = VITRA_LOGO_INNER` (faria criativos Premium
usarem o logo da Imobiliaria — quebra a separacao de marcas) e (2) lógica de headline do financiamento
simplificada. Corrigido na **v59** (LOGO_INNER do Premium restaurado, `financingHeadlineParts` completa)
e validado com render real do financiamento + hero-panel. O `index.ts` no git e a versao detalhada e
documentada (deno check OK); a producao roda o equivalente validado. Licao reforcada: um **Supabase
CLI** local (`supabase functions deploy`, le do disco) eliminaria essa fragilidade — ver
[[render-asset-deploy-e-limites]].

## Estado
7 templates aprovados da Imobiliaria, todos nascendo com safe zone do Meta (skill
margem-seguranca-criativos). Pendencia conhecida (mantida): auditar patios-gallery, financiamento-orla
e menino-deus contra a safe zone. Working tree limpo, tudo pushado.
