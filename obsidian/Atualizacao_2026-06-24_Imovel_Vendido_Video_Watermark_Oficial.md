# Atualizacao 2026-06-24 — Imóvel Vendido (vídeo): marca d'água OFICIAL (correção)

> Troca do lockup desenhado pelo PNG oficial aprovado para vídeo. Na `main`. Commit: **d66f70a**.
> Corrige a marca d'água de [[Atualizacao_2026-06-23_Imovel_Vendido_Video_Mascara_v2]].

## O que estava errado
Na v2 eu **redesenhei o lockup VITRA IMOBILIÁRIA no canvas** (e ainda acrescentei "IMOBILIÁRIA"), em vez de
usar os arquivos oficiais. Existe biblioteca aprovada em
`vitra-agentes-marketing/assets/brand/watermark/video-aprovadas` (brand "Vitra Imobiliária"), com a regra
explícita: *"nenhum glifo foi redesenhado ou interpretado"* e *"não adicionar sombra/contorno/brilho/filtro"*.
A marca d'água oficial é só o **V + VITRA** (não "VITRA IMOBILIÁRIA").

## Correção
- Copiei os PNGs oficiais **`v-vitra-horizontal`** (op15/op25/op40) para `dashboard/public/pecas/`
  (`wm-vitra-video-h-op{15,25,40}.png`) — a variante mais adequada para "centralizada horizontalmente".
- `drawWatermark` agora **desenha o PNG oficial** centralizado horizontalmente (sem redesenhar glifo, sem
  filtro), com a opacidade já embutida no arquivo. Mesma origem do app → canvas não fica "tainted"
  (MediaRecorder segue funcionando).
- **Seletor de opacidade** 15/25/40 (regra da marca: 25% geral · 15% fundos claros · 40% destaque). Padrão 25%.
- PNG é same-origin → canvas limpo p/ export.

## Verificação (ao vivo)
build OK (PNGs presentes em `dist/pecas`). No preview, via amostragem de pixels do canvas: a imagem oficial
carrega (1880×520), o `drawMask` desenha a marca d'água centralizada — op25 → brilho ~89, op40 → ~122 sobre o
navy (coerente com 25%/40% de branco). Obs.: o `requestAnimationFrame` fica pausado na aba em segundo plano do
preview headless (por isso screenshot/loop "congelam"); no navegador do operador (aba em foco) roda normal.

Inalterado: carimbo VENDIDO, degradê da headline, colchetes, mensagem/corretor, formatos 9:16/4:5, fluxo.
