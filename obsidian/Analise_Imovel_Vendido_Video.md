# Análise — "Imóvel Vendido" em vídeo (Estúdio de Peças)

> Nota de referência (PO + dev sênior): diagnóstico, arquitetura faseada e specs da peça de vídeo de prova
> social. Fase 1 entregue — ver [[Atualizacao_2026-06-23_Imovel_Vendido_Video_Fase1]].

## Diagnóstico da estrutura atual
O Estúdio de Peças é **100% client-side e estático**: `pecasCatalog.js` (data-driven) → cada formato aponta
um **HTML standalone** em `public/pecas/`; `EstudioPecas.jsx` só lista cards e faz `window.open()` do gerador.
Cada gerador edita ao vivo e exporta **PNG via html2canvas** (`toDataURL`). `html2canvas` rasteriza **um
quadro** — não há caminho de vídeo. Vídeo é pipeline novo (frames + compositing + encode + áudio), mas o
**padrão de plugar** (1 entrada no catálogo + 1 HTML) e a **identidade do "Imóvel Vendido"** são reaproveitáveis.

Restrições de infra: Hostinger **gerenciado** (sem ffmpeg server-side); Supabase **Edge** (Deno, sem binários
nativos pesados); **render-worker** (Node/Fly) **dormente** — único lugar p/ ffmpeg server, exige ativação.

## Arquitetura (decisão de PO): faseado
- **Fase 1 (entregue): processamento no navegador** — Canvas + `MediaRecorder` (`captureStream`) + WebAudio
  (mix de áudio). Zero backend, casa com o padrão do Estúdio, custo zero, preview = canvas (WYSIWYG).
- **Fase 2 (futuro): worker server-side + ffmpeg** — Fly + fila no Supabase + Storage; garante MP4/H.264,
  capa por frame e estados assíncronos robustos. Só quando volume/qualidade exigir.

## Estrutura visual da máscara (não cobre o corretor/sino)
Moldura **periférica**, centro livre. Topo: gradiente navy + **logo VITRA** (esq.) + **selo VENDIDO** (dir.).
Base: gradiente navy + **mensagem** ("Mais um imóvel vendido") + **nome do corretor** (opcional) + régua
dourada. 4 **colchetes dourados** nas quinas. Centro (~60%) **livre**. Safe-area 9:16: topo ~250px / base
~420px reservados à UI de Reels/Stories.

## Campos
**Obrigatórios:** vídeo válido, formato (9:16), mensagem (preset padrão). **Opcionais:** nome do corretor,
complemento, trilha + volume, áudio original on/off, corte (in/out), zoom/reposição, capa.

## Regras de negócio / validações
- **Imobiliária primeiro** (Premium depois — separação dura).
- Entrada: ≤ 60s, ≤ 150 MB, até 1080p, H.264/HEVC/VP9 — fora → erro acionável.
- **WhatsApp Status**: ≤ 30s e ~16 MB (avisar).
- Áudio original preservado por padrão; trilha **mixa** (não substitui, salvo silenciar original); aviso de
  direitos autorais.
- Sem dados sensíveis (institucional). Safe-area respeitada. Identidade não editável pelo usuário.

## Tecnologias
Fase 1: `HTMLVideoElement` + `Canvas 2D` + `canvas.captureStream` + `MediaRecorder` + WebAudio. Capa =
`canvas.toBlob`. (Opcional: `@ffmpeg/ffmpeg` wasm só p/ remux→MP4.) Fase 2: render-worker + `ffmpeg`.

## Exportação (9:16)
1080×1920, MP4 H.264+AAC preferido (senão WebM), ~8–10 Mbps, ≤ 60s, áudio AAC ~128 kbps. Capa PNG 1080×1920.

## Critérios de aceite
Alternar estática/vídeo · upload validado · máscara automática sem cobrir o centro + safe-area · corte +
enquadramento · áudio original + trilha (mix) · mensagem + corretor · capa PNG · export 9:16 social
(WhatsApp ≤30s/16MB) · estados processando/sucesso/erro · preview = saída · sem vazamento de marca.
