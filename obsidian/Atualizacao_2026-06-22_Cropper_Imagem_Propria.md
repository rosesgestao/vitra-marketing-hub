# Atualizacao 2026-06-22 — Cropper da imagem própria (reposicionar + zoom)

> A aba "Imagem própria" do drawer ganha recorte interativo: arrastar para reposicionar + zoom, com o
> enquadramento "baked" na arte salva, por formato. Na `main`. Commit: **<HASH>**.

## Contexto
Fecha o "próximo passo opcional" do upload de imagem: antes o recorte era cover centralizado fixo. Agora o
operador controla o **ponto focal** (arrastar) e o **zoom**, vendo exatamente o que será gravado.

## Entregue (`PostDetailDrawer`, front-only)
- Helper puro `drawCroppedImage(ctx, img, TW, TH, scale, fx, fy)` — desenha o recorte (cover + zoom + foco)
  no canvas alvo. **Mesma função** alimenta a prévia e o arquivo salvo (o que vê é o que grava).
- Estado `crop {scale, fx, fy}` + `ownImg` (HTMLImageElement). `validatePostImageFile` agora devolve o `img`.
- Prévia: `<canvas>` no enquadramento do formato (Feed 1:1 / Story 9:16); **arrastar** (pointer events,
  `touch-none` p/ mobile) move o ponto focal; **slider de Zoom** (1×–3×) + botão **"centralizar"** (reset).
- Trocar o formato (feed/story) re-renderiza o recorte; trocar imagem reseta o crop.
- **Salvar como arte:** renderiza um canvas no tamanho do formato (`postArtDims`) com o recorte e envia como
  **JPEG 0.92** (qualidade boa, peso menor) via `uploadPostArt` → vira `art_url` + entra nas versões.

## Verificação (ao vivo)
- lint limpo · **162 testes** ✓ · build OK.
- Preview: injetei um arquivo de teste no input → o **canvas de recorte** apareceu com o frame Feed 1:1, o
  **slider de Zoom**, "centralizar" e "Salvar como arte"; mover o zoom para 2× atualizou o estado/redraw
  (screenshots conferidos). Sem upload nativo (diálogo), a injeção via DataTransfer exercitou o caminho real.

## Observações
- Recorte só se aplica à imagem **recém-enviada** (pendente). Arte já salva é exibida como está (sem
  re-crop, pois é a imagem achatada). Para re-recortar, basta "Substituir" e enviar de novo.
- A arte branded (Tipográfico/Com foto) segue pelo `postArtBlob`; só a "Imagem própria" usa o cropper.

Ver [[Atualizacao_2026-06-22_Upload_Imagem_Propria_Drawer]] e [[Atualizacao_2026-06-22_Producao_Visual_Fase2]].
