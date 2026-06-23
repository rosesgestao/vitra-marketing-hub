# Atualizacao 2026-06-23 — Estúdio de Peças: categoria Comunicação Interna (endomarketing)

> Nova funcionalidade de endomarketing + 1ª peça (evento Brasil × Escócia). Na `main`. Commit: **<HASH>**.

## Funcionalidade (data-driven, segue o padrão do Estúdio de Peças)
- Nova categoria **"Comunicação Interna"** em `pecasCatalog.js` (ícone PartyPopper, disponível na Imobiliária)
  — peças de cultura/engajamento da equipe. Aparece sozinha no menu do Estúdio de Peças (verificado).
- Gerador **`public/pecas/evento-interno-vitra-imobiliaria.html`** — "Convite de evento" **multiformato**:
  **Feed 4:5 (1080×1350)**, **Stories/Status 9:16 (1080×1920)** e **Post 1:1 (1080×1080)** num só gerador,
  com troca de formato + export PNG por formato (html2canvas). WhatsApp = Stories/Status ou Post; Instagram
  = Feed ou Stories.
- Textos **editáveis ao vivo** (contenteditable) e **upload da foto do ambiente** como fundo (sem foto, usa
  o gradiente da marca). Identidade Imobiliária: navy #0A1628 + dourado #C4942A + Inter/Playfair, logo "V"
  faceto, com acento **verde-amarelo sutil** (fita no topo + ponto) e tag "Copa 2026" — Brasil/futebol sem
  comprometer a elegância da marca.

## 1ª aplicação — evento Brasil × Escócia (amanhã, 19h)
Conteúdo pré-preenchido: "CONFRATERNIZAÇÃO DA EQUIPE · BRASIL × ESCÓCIA", "Amanhã · 19h", "Salão de Vendas",
combinado em destaque ("cada um leva um corte de carne pro churrasco"), CTA "Bora torcer juntos!".

## Correções de export (html2canvas 1.4.1) durante a verificação
- `createPattern ... width/height 0`: causado por **gradiente em caixa de 2px** (linhas decorativas do
  separador `×`) → trocado por cor sólida. (conic-gradient e SVG sem width/height também foram saneados por
  segurança.) Emoji de bandeira 🇧🇷 vira "BR" no html2canvas → removido do texto padrão.
- Resultado: export PNG OK nos **3 formatos** (1080×1350 / 1080×1920 / 1080×1080), verificado ao vivo.

## Verificação
lint + **164 testes** + build OK. Gerador carregado no preview; 3 formatos renderizados e baixados; categoria
visível no menu do Estúdio de Peças. (Geradores são estáticos em public/pecas — sem deploy de Edge.)

Observação: para a versão com foto, o operador sobe a imagem do salão no botão "📷 Foto do salão" (não foi
possível embutir as fotos anexadas no chat como bytes; o gradiente da marca é o fallback elegante).
