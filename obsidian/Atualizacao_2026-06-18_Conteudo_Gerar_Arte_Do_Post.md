# Atualizacao 2026-06-18 — Conteúdo: "Gerar arte do post" (imagem branded do texto)

> Decisao de produto pendente resolvida: o post orgânico precisava de IMAGEM (a IA só dava a direção
> visual). Nova feature gera a arte branded a partir do texto — distinta do "Gerar criativos" pago.
> Na `main`. Commit: **3d9627f**.

## Abordagem (dev sênior)
O dashboard NAO tinha lib de captura; o `render-asset` (Satori) e pesado, acoplado a `meta_ads`/oferta e
com risco de OOM no 9:16 — **nao** e o lugar. Escolhido o motor **Canvas 2D no cliente** (igual em
espirito ao html2canvas das peças/skill vitra-design, mas sem dependencia nova e deterministico). Cartao
**tipografico** (nao precisa de foto — post organico nem sempre tem imagem de imovel), fiel ao brandbook
por marca.

## Entregue
- **`dashboard/src/lib/postArt.js`** (puro, Canvas 2D): `renderPostArtToCanvas` / `postArtBlob`. Desenha
  fundo+gradiente, moldura/regua dourada, kicker (pilar/marca), TITULO em Playfair com auto-fit, linha de
  apoio (1a frase da legenda) em Inter, chip de CTA e assinatura da marca. Dimensoes por formato
  (feed 1:1 / carrossel 4:5 / reels|stories 9:16). Tokens por marca: Imobiliária navy+dourado, Premium
  preto+dourado. `ensureArtFonts()` espera Playfair+Inter (document.fonts) antes de desenhar.
- **`uploadPostArt({postId,blob,brandScope})`** (premiumData): upload do PNG para o bucket publico
  **`cards`** (mesmo dos uploads do projeto) em `organic-art/<scope>/<postId>-<ts>.png` + grava
  `metadata.art_url`/`art_path` no post (merge nao destrutivo). NAO usa o render-asset.
- **UI — `PostArtModal`**: preview do canvas + **"Baixar PNG"** + **"Salvar no post"**. Acionado por
  **"Gerar arte"/"Ver arte"** em cada card do funil (qualquer etapa).

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview: abri um post (formato stories) -> arte **navy+dourado 1080×1920**
renderizada (título Playfair, kicker, CTA, assinatura). "Salvar no post" -> upload no Storage (a URL
publica serve **HTTP 200 · image/png · 406 KB**) e `metadata.art_url` gravado. Zero erro no console.
Metadata de teste revertida no post real (o objeto no Storage ficou orfao, inofensivo).

## Distincao registrada
"Gerar arte do post" (organico, tipografico, client, bucket cards) ≠ "Gerar criativos"/"Gerar cortes"
(tráfego pago, Satori, Meta Ads, render-asset). Mundos separados, como manda o Brand System.

## Follow-ups
- Variações de layout (com foto opcional do imóvel; mais de um template por formato).
- Mostrar a thumbnail da arte direto no card/Calendário; usar a arte no "Marcar publicado".
- Limpar objetos orfaos do bucket se acumular.

Continuacao de [[Atualizacao_2026-06-18_Conteudo_Importar_Plano_Editorial]]. Ver [[conteudo-organico]].
