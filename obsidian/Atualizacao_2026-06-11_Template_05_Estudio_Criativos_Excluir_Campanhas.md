# Atualizacao 2026-06-11 — Template 05 (foto + checklist), Estudio de Criativos e excluir campanhas

> Continuacao de [[Atualizacao_2026-06-09_Sidebar_Acordeao]]. Tres entregas que estavam no working tree sem
> commit + o alinhamento de paleta do novo template ao brandbook. Tudo na `main`, pushado (`9ed0ea1..c36831a`).
> Commits: **529ebc6** (Estudio de Criativos), **aee7749** (excluir campanhas), **1ce33b3** (Template 05),
> **c36831a** (contexto copywriting). Edge `render-asset` no deploy **v54**.

## 1. Template 05 — "Foto de fundo com checklist" (commit 1ce33b3)
Quinto template aprovado da Vitra Imobiliaria para Trafego Pago, modelado na peca **New Life / Av. Ipiranga**
(`criativos-aprovados-vitra-imobiliaria/new life.jpeg`). Aparece **automaticamente** no modal Nova Campanha
porque o modal le os templates do catalogo (`creativeTemplateCatalog.js`).

**Arte:** foto unica full-bleed + veu navy a esquerda (gradiente horizontal + vertical), wordmark VITRA branco
no topo direito, headline condensada (fonte Anton), preco **De** (riscado) / **Por**, checklist de ate 5
atributos com selo `badge-check` dourado e botao CTA. Nos 3 formatos (1:1, 9:16, 1.91:1) x sem/com moldura.

**Paleta — alinhada 100% ao brandbook (ponto de atencao do usuario):** a peca de referencia usava um amarelo
vivo `#FBC52D` que NAO existe no [BRAND.md](BRAND.md). Numa primeira versao usei esse amarelo (fidelidade ao
anexo); a pedido do usuario, troquei pelo dourado oficial, seguindo a convencao dos outros 4 templates:
- Preco "Por" + selos -> **`#F0C95C` (GOLD_LIGHT**, familia dourada) — dourado claro legivel sobre o navy.
- Botao CTA -> preenchido com **`#C4942A` (GOLD**, dourado oficial) + texto navy `#07111F`.
- Moldura (variante com-moldura) -> `#C4942A`. Navy/branco ja estavam corretos.

**Arquivos:**
- `creativeTemplateCatalog.js`: family `vitra-imobiliaria-hero-checklist` com field groups (headline, price_from,
  price, differentials, cta), 6 recipes de variacao e `renderVersion: hero-checklist-approved-v1`.
- `render-asset/index.ts`: `buildVitraHeroChecklistSvg` (layout por formato) + fontes **Anton** e **Poppins**
  500/600/700 adicionadas ao resvg. So afetam SVGs que as referenciam por font-family; os 4 templates antigos
  seguem resolvendo Inter. `maxTemplateImages=1` para esta family.
- `_shared/renderVersions.ts`: espelho do render-version (o teste de guarda barra divergencia catalogo<->Edge no CI).
- `templateCatalog.test.js`: contagem Imobiliaria 4->5 e guarda do novo render-version. **148 testes verdes**, deno check OK.
- `public/generated/vitra-imobiliaria/template-05-hero-checklist-*.png`: 6 previews renderizados pelo Edge v54.

## 2. Estudio de Criativos (commit 529ebc6)
Nova secao isolada na sidebar (entre Pecas e Operacao) que traz o fluxo da skill `gerar-criativo` para dentro
da ferramenta: o operador preenche dados do imovel + sobe fotos -> o sistema gera 3 formatos HTML (1:1, 9:16,
1.91:1) com preview em iframe escalado e exportacao PNG via blob no proprio navegador. Area independente,
removivel sem impacto nas outras telas (validacao de produto).
- `creativoTemplates.js`: engine dos 3 formatos + `fileToBase64`, `fetchAsBase64` (logo), `openHtmlBlob`.
- `EstudioCriativos.jsx`: form, `PhotoSlot` (drag&drop), `DiferenciaisInput` (chips), `FormatPreview` (iframe
  `srcDoc` com `transform: scale`). `App.jsx`: `CRIATIVOS_NAV` + rota `criativos:*`. `index.css`: `.form-label`/`.form-input`.

## 3. Excluir campanhas de teste pela UI (commit aee7749)
Botao de lixeira (Trash2) no hover de cada card de campanha — no Painel (aba Campanhas) e na sessao de Trafego
Pago das duas marcas. `window.confirm` antes de excluir; recarrega a lista e limpa selecao depois.
- `premiumData.js`: `deleteCampaign(campaignId)` — DELETE unico; `ON DELETE CASCADE` remove
  assets/posts/jobs/metrics/publications da campanha.
- `PremiumDashboard.jsx`: `handleDeleteCampaign` + `onDelete` encadeado; cards viraram `<div role=button>` com
  `stopPropagation` no clique do lixo.
- **Limpeza do banco** (feita por SQL): 29 -> 6 campanhas, no maximo 3 por marca; CASCADE limpou os filhos.

## 4. Contexto de copywriting (commit c36831a)
`.agents/product-marketing.md` (contexto Vitra: duas marcas, regras de nao-contaminacao, publicos, tom de voz)
lido pela skill `copywriting` antes de escrever, evitando re-coleta de contexto. Skill instalada de
`coreyhaines31/marketingskills`, com `skills-lock.json` travando o hash.

## Nota de processo
O deploy do Edge via MCP usa conteudo inline (~60KB). Ao redeployar o ajuste de paleta, reposicionei uma const
no payload e tive que realinhar o disco depois — git e producao agora batem (deno check limpo). Lembrete: um
**Supabase CLI** local (`supabase functions deploy`, le do disco) tornaria os proximos deploys menos frageis.

## Estado
Template 05 no ar e listado no modal Nova Campanha da Imobiliaria, paleta 100% brandbook, previews atualizados.
Estudio de Criativos e exclusao de campanhas funcionais. Working tree limpo, 4 commits pushados.
