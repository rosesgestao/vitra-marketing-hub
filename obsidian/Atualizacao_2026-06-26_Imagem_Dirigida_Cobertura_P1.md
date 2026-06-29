# Atualização 2026-06-26 — Imagem dirigida nos full-bleed (fecha P1)

Consolidação do P1: estende a **imagem dirigida** (`dsImageLayer` — enquadramento por foco + grade navy)
aos templates de **foto full-bleed** que ainda usavam slice central.

## Migrados
- **hero-checklist** → `dsImageLayer(grade:true)`. Grade navy soma coesão de marca ao véu esquerdo que já
  existia; story enquadra o **topo do prédio** (foco), não o meio.
- **oportunidade-bairro** → `dsImageLayer(grade:false)`. Só o enquadramento por foco — o template já
  escurece com o overlay 0.18 + os blocos navy; não precisa de grade extra.

## Por que só estes dois
A imagem dirigida (foto = a tela) aplica a templates de **fundo full-bleed**: destino e oferta (já feitos),
+ hero-checklist e oportunidade (agora) = **4 cobertos**. Os de **galeria** (duo-selos, hero-panel,
lançamento, ficha) usam **tiles emoldurados** (`duoSelosPhoto`) — modelo de imagem diferente, fora do
escopo do dsImageLayer full-bleed. Vitrine tem foto clipada ao painel diagonal (caso à parte).

## Bumps + previews
Arte mudou → bump de render-version: `hero-checklist-ds-image-v4`, `oportunidade-bairro-ds-image-v2`
(espelhados no catálogo; teste de guarda passa). Regerei os **12 previews** (2 templates × 3 formatos ×
com/sem-moldura) via Edge real → baixados para `public/generated/vitra-imobiliaria/`.

## Verificação
deno check + lint + 172 testes + build OK; deploy via CLI. Os 12 cortes renderizaram com **`lint.ok=true []`**
(o gate continua limpo após o reframe). Inspeção visual: hero-checklist (1:1 e 9:16) com grade + foco-topo
legível; oportunidade (1:1) com foco no prédio + blocos/galeria intactos. Assets de teste removidos.
(1 corte 9:16 com-moldura deu 546 em isolate frio — re-render OK, padrão conhecido.)

## Estado do P1
Imagem dirigida agora nos 4 templates full-bleed (destino, oferta, hero-checklist, oportunidade). Os de
galeria seguem com tiles emoldurados (decisão consciente). **P1 fechado para o modelo full-bleed.**

## Próximo
- Skill "Direção de Arte Vitra" (layout spec + ajuste de copy) — peça que torna a geração proativamente boa.
- (Opcional) grade sutil nos tiles de galeria (`duoSelosPhoto`), se quisermos coesão também ali — é uma
  mudança ampla (toca 5 templates) e ficou de fora por enquanto.

Commit: render-asset (hero-checklist + oportunidade → dsImageLayer) + renderVersions/catalog (2 bumps) +
12 previews.
