# Atualizacao 2026-06-23 — Boas-vindas + versões Premium do endomarketing

> Novo modelo boas-vindas (2 marcas) + Premium (preto+dourado) de comunicado/metas/aniversariantes. Na `main`. Commit: **<HASH>**.

## Entregue (categoria Comunicação Interna)
- **Boas-vindas a novo colaborador** — `boas-vindas-interno-vitra-imobiliaria.html` e
  `…-vitra-premium.html`: kicker + "É uma alegria/honra ter você", **nome em destaque** (Playfair),
  cargo/equipe e mensagem de boas-vindas. Multiformato + foto do colaborador/ambiente.
- **Versões Premium (preto + dourado, editorial)** dos institucionais que cruzam bem:
  `comunicado-interno-vitra-premium.html`, `metas-interno-vitra-premium.html`,
  `aniversariantes-interno-vitra-premium.html`. Fundo preto, logo VITRA PREMIUM (V dourado, **sem azul**),
  Playfair com mais respiro, fitas/réguas douradas finas, voz mais editorial.

## Decisão de PO (o que NÃO cruzou)
O **"Convite de evento"** (Brasil × Escócia / churrasco, com acento verde-amarelo de futebol) **fica só na
Imobiliária** — destoa do posicionamento editorial de luxo da Premium. Cruzar seria contaminar a marca.

## Catálogo (pecasCatalog)
A categoria `interno` agora tem **5 modelos**; variantes por marca:
- evento → só Imobiliária.
- aniversariantes / comunicado / metas → Imobiliária **+ Premium**.
- boas-vindas (novo) → Imobiliária **+ Premium**.
O `EstudioPecas` mostra a peça como disponível conforme a marca ativa (toggle no topo); na Premium, o evento
aparece como indisponível (sem variante) — correto.

## Verificação (ao vivo, PNG real rasterizado)
Construídos sobre o esqueleto validado do `evento-interno` (todas as correções de export do html2canvas
embutidas). Conferido por screenshot do PNG real: boas-vindas Imob (1080×1350), metas Premium (1080×1350) e
aniversariantes Premium (1080×1920) — layout íntegro, sem sobreposição, marca correta em cada uma.
lint + build OK.

Ver [[Atualizacao_2026-06-23_Endomarketing_3_Modelos]].
