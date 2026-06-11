---
name: margem-seguranca-criativos
description: >-
  Regras de MARGEM DE SEGURANCA (safe zone) do Meta/Instagram por formato para criativos de anuncio
  da Vitra — onde texto, logo, preco e CTA podem ficar sem risco de corte ou de serem cobertos pela
  UI da plataforma (botoes de Stories/Reels, legenda do feed). Cobre Feed 1:1 (1080x1080), Feed 4:5
  (1080x1350), Feed/Paisagem 1.91:1 (1200x627), Stories 9:16 e Reels 9:16 (1080x1920). USE SEMPRE
  que for criar, revisar ou ajustar o LAYOUT de um criativo de anuncio — em conjunto com a skill
  gerar-criativo e ao trabalhar no Estudio de Criativos do dashboard — ou quando o usuario falar em
  "margem de seguranca", "safe zone", "area segura", "corte", "elemento cortado", "tapado pela UI",
  "vai ser cortado no story/reels". Aplica-se as duas marcas (Imobiliaria e Premium).
metadata:
  version: 1.0.0
---

# Margem de Seguranca para Criativos de Anuncio — Vitra

Onde os elementos importantes (headline, preco, selos, logo, CTA) PODEM ficar para nao serem cortados
nem cobertos pela interface da plataforma. A regra e simples: **conteudo critico dentro da safe zone;
so fundo/foto/cor pode sangrar ate a borda.**

## Por que isso importa
- **Feed**: a plataforma corta levemente e a legenda/CTA do anuncio entra por baixo — elementos colados
  na borda inferior somem ou competem com a UI.
- **Stories**: as faixas de cima (avatar/nome) e de baixo (campo "Enviar mensagem", barra de progresso)
  cobrem ~250px cada. Texto ali fica ilegivel.
- **Reels**: alem do topo, a base reserva MUITO mais (legenda + CTA + audio ≈ 450px) e o lado direito
  tem a coluna de acoes (curtir/comentar/compartilhar). E o formato mais restritivo.

## Especificacao oficial (fonte: Meta Ads safe zones)
Valores como `topo / base / laterais` em pixels (e % do canvas).

| Placement            | Canvas        | Topo         | Base          | Laterais             |
|----------------------|---------------|--------------|---------------|----------------------|
| Feed Quadrado 1:1    | 1080 x 1080   | 108 (10%)    | 108 (10%)     | 108 (10%)            |
| Feed Retrato 4:5     | 1080 x 1350   | 135 (10%)    | 135 (10%)     | 108 (10%)            |
| Feed Paisagem        | 1080 x 608    | 61 (10%)     | 61 (10%)      | 80 (7.4%)            |
| Stories 9:16         | 1080 x 1920   | 250 (13%)    | 250 (13%)     | 35 (3.2%)            |
| Reels 9:16           | 1080 x 1920   | 250 (13%)    | 450 (23.4%)   | 35 (3.2%) + coluna direita |

A coluna de acoes do Reels ocupa ~**120px** na borda direita, dos ~2/3 inferiores para baixo —
mantenha esse canto livre de texto/CTA.

## Mapeamento para os formatos da Vitra
Os criativos da Vitra saem em 3 formatos; aqui estao os valores ja convertidos para os tamanhos reais
que o sistema usa (`creativeTemplateCatalog.js`, `creativoTemplates.js`, `render-asset`):

| Formato Vitra        | Canvas        | Topo | Base                 | Laterais | Observacao |
|----------------------|---------------|------|----------------------|----------|------------|
| 1:1 (feed)           | 1080 x 1080   | 108  | 108                  | 108      | brand usa 135 (mais conservador) — OK, 108 e o piso |
| 9:16 (story/reels)   | 1080 x 1920   | 250  | **450** (reels-safe) | 35       | projete para REELS por padrao (base 450 + canto dir.) |
| 1.91:1 (paisagem)    | 1200 x 627    | 63   | 63                   | 89       | 10% topo/base, 7.4% laterais escalados para 1200x627 |

**Regra de ouro do 9:16**: como o mesmo PNG roda em Stories E Reels, projete para o **mais restritivo
(Reels)** — base de 450px livre e o canto inferior direito (~120px) sem texto/CTA. Assim a peca fica
segura nos dois. Se for EXCLUSIVO de Stories, pode usar base 250.

## Como aplicar

### Ao gerar via skill `gerar-criativo` (artifacts HTML)
- Mantenha o **bloco de conteudo** (headline + sub + preco + bullets + CTA + logo) **dentro da safe
  zone** do formato. Fundo navy/foto pode (e deve) sangrar ate a borda — so o conteudo respeita a margem.
- Use `padding` no container de conteudo igual a safe zone do formato (ex.: 1:1 → `padding: 108px`;
  9:16 → `padding: 250px 35px 450px 35px`; 1.91:1 → `padding: 63px 89px`).
- No 9:16, **nao** ancore o CTA no rodape absoluto — deixe a faixa de 450px de respiro embaixo.

### Ao trabalhar no Estudio de Criativos / templates do Edge
- Os layouts aprovados ja embutem respiro de borda (ver `approvedTemplateLayout` em
  `supabase/functions/_shared/textFit.ts`). Ao criar/ajustar coordenadas, confira contra os valores
  da tabela Vitra acima — nenhum texto/preco/CTA deve cair fora da safe zone.
- Para revisao visual, sobreponha o overlay do formato (`assets/overlay-*.svg`) sobre o criativo
  renderizado em 100%: tudo que for critico tem de estar na area transparente (central).
- Valores prontos para importar no codigo: `references/safe-zones.json`.

## Checklist rapido (antes de aprovar)
- [ ] Headline, preco, selos, logo e CTA TODOS dentro da safe zone do formato?
- [ ] 9:16 projetado para Reels (base 450 livre + canto inferior direito sem CTA)?
- [ ] Fundo/foto sangra ate a borda (sem moldura branca acidental fora da arte)?
- [ ] 1.91:1 com laterais de 89px (mais apertado que feed quadrado)?
- [ ] Logo respeitando a margem (nao colado no canto)?

## Erros comuns
- CTA colado no rodape do 9:16 → coberto pela barra "Enviar mensagem" / legenda do Reels. ❌
- Preco/selo no canto inferior direito do 9:16 → tapado pela coluna de acoes do Reels. ❌
- Texto a 1.91:1 usando margem de 108px (feed quadrado) → as laterais do paisagem sao mais estreitas (89px). ❌
- Confundir "sangrar a foto ate a borda" (OK) com "por TEXTO ate a borda" (corta). ❌

## Arquivos da skill
- `references/safe-zones.json` — spec machine-readable (px e % por placement), para o codigo consumir.
- `assets/overlay-1x1.svg`, `overlay-9x16-story.svg`, `overlay-9x16-reels.svg`, `overlay-1.91x1.svg`
  — overlays de safe zone (area segura transparente, margem em vermelho) para conferencia visual a 100%.
