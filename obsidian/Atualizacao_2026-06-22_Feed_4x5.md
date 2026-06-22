# Atualizacao 2026-06-22 — Feed organico passa a 4:5 (vertical recomendado)

> Troca o formato de feed de 1:1 para **4:5** (1080×1350) em todo o fluxo organico — geração, prévia,
> edição, recorte e exportação. Story segue 9:16. Na `main`. Commit: **854d3b5**.

## Mudança (fonte única + UI + IA)
- **`postArt.js` `DIMS.feed`: [1080,1080] → [1080,1350]** (4:5). É a fonte única: render da arte branded,
  alvo do cropper (`postArtDims`), e todas as prévias com `format:'feed'` passam a 4:5 automaticamente.
- **Drawer "Prévia do post":** toggle "Feed 1:1" → **"Feed 4:5"**; frame do cropper `1/1` → **`4/5`**; texto
  de ajuda atualizado. **Exportação** (Salvar arte / imagem própria recortada) sai em 4:5.
- **Grade de Produção:** thumbnail do card `aspect-square` → **`aspect-[4/5]`** (prévia fiel ao feed).
- **Geração (`contentPlaybook.ts`):** spec do formato `feed` "1:1 1080x1080" → **"4:5 1080x1350"** (entra no
  prompt da IA, alinhando a direção visual). Edge `generate-content` redeployada.

## Escopo / não-alvo
Só o **organico** (Conteúdo / `postArt`). As peças de **Tráfego Pago** (Meta Ads via `render-asset`/`textFit`)
seguem com seus formatos próprios (1:1, 9:16, 1.91:1) — não foram tocadas.

## Verificação (ao vivo)
- deno check OK; deploy CLI. lint limpo · **162 testes** ✓ · build OK.
- Preview: toggle mostra "Feed 4:5" (sem "Feed 1:1"); o canvas branded renderiza vertical (4:5) e os cards
  da grade ficaram 4:5 (screenshots conferidos).

Ver [[Atualizacao_2026-06-22_Cropper_Imagem_Propria]] e [[Atualizacao_2026-06-22_Producao_Visual_Fase2]].
