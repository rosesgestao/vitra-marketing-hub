# Atualizacao 2026-06-23 — "Imóvel Vendido" em VÍDEO (Fase 1, 9:16)

> Versão em vídeo da prova social, processada no navegador. Na `main`. Commit: **c611811**.
> Base de decisão: [[Analise_Imovel_Vendido_Video]].

## Entregue
Novo gerador **`public/pecas/imovel-vendido-video-vitra-imobiliaria.html`** (Estúdio de Peças → Marketing
Institucional, **Imobiliária**), formato **9:16 (1080×1920)** para Reels · Stories · WhatsApp Status. O
operador sobe o **vídeo do corretor tocando o sino** e a **máscara navy+dourado** é aplicada por cima **sem
cobrir o centro**.

## Como funciona (Fase 1 — client-side, sem backend)
Composição 100% no **canvas**: cada frame desenha o vídeo (cover + **zoom/arraste** p/ enquadrar) e por cima
a **máscara desenhada nativamente** (logo VITRA monograma+wordmark, **selo VENDIDO**, colchetes dourados,
gradientes navy topo/base, **mensagem** + **nome do corretor**). Texto/logo via Canvas 2D (não SVG
rasterizado) para usar as **fontes da marca** (Inter) sem o problema de webfont em `<img>`-SVG.
- **Corte** início/fim (2 sliders, loop na seleção, cap 60s).
- **Áudio**: original on/off + **trilha opcional** mixada via **WebAudio** (`MediaStreamAudioDestinationNode`).
- **Capa PNG** = snapshot do frame com a máscara (`canvas.toBlob`).
- **Export** = `canvas.captureStream(30)` + faixa de áudio → **`MediaRecorder`** (MP4 se o navegador suportar,
  senão WebM), gravando em tempo real a seleção `[in,out]`.
- **Estados**: processando / sucesso (download) / erro (validações de duração ≤60s e tamanho ≤150 MB).
- **Safe-area 9:16**: logo/selo no topo (~y300), mensagem na base (~y1470), **centro livre**.

## Catálogo
`pecasCatalog.js`: novo formato `imovel-vendido-video` na plataforma `institucional` (variant Imobiliária),
9:16, nota explicando o fluxo. A view `EstudioPecas.jsx` não muda (data-driven → abre o HTML).

## Verificação (ao vivo)
lint + build OK. Gerador aberto no preview (dev server): **máscara renderiza correta** sobre o placeholder
(logo, selo VENDIDO, colchetes, gradientes, mensagem; centro livre), todos os controles presentes, **console
limpo**. O encode em si roda no navegador do operador (gravação em tempo real) — não automatizável aqui, mas
o caminho de compositing/máscara/UI está verificado e a lógica de `MediaRecorder`/WebAudio é padrão.

## Escopo e próximos
Só **9:16** e **Imobiliária** nesta fase (como pedido). Próximos possíveis: 4:5/1:1, versão Premium,
biblioteca de trilhas livres, e **Fase 2** (worker + ffmpeg) p/ MP4 garantido + capa por frame + fila.

Ver [[Atualizacao_2026-06-23_Imovel_Vendido_Institucional]] (versão estática).
