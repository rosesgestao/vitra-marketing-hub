# Atualizacao 2026-06-23 — Estúdio de Peças: Crachá Corporativo (CR-80 PVC, fiel ao brandbook)

> Nova categoria "Crachá Corporativo" gerando crachá vertical 5,4×8,5 cm p/ Canva + gráfica PVC. Na `main`. Commit: **<HASH>**.

## Fonte (brandbook — seção "Crachá Corporativo")
Lido em `vitra-agentes-marketing/vitra_brand_assets/vitra-brandbook.html` (linhas 583-630). Padrão oficial:
card vertical navy `linear-gradient(180deg,#0A1628,#0F2140)`, **slot oval superior** (barra dourada),
**ícone Vitra colorido**, **foto circular** com anel dourado, **Nome** (branco 600, +1px), **Cargo**
(dourado, uppercase, +3px), rodapé com **borda-topo dourada** "Vitra Imobiliária · Porto Alegre".
Ficha: **CR-80, PVC branco 0,76mm, sublimática frente/verso, fosco, cordão navy + presilha dourada**.
Tagline aprovada "Viva · Invista · Evolua". Reproduzido fielmente — sem identidade paralela.

## Funcionalidade (gerador `public/pecas/cracha-corporativo-vitra-imobiliaria.html`)
- **Editor:** form (nome, cargo, setor, matrícula/ID, cidade, QR) + preview ao vivo.
- **Foto:** upload + zoom (slider) + reposicionar (arraste) na **moldura circular** do brandbook.
- **Frente e verso:** frente = brandbook; verso = mesma linguagem (ícone + **QR** em caixa branca +
  matrícula + slogan + rodapé). QR via `qrcode-generator` (SVG, escaneável).
- **Guias:** corte (vermelho) + área de segurança (verde), ocultados no export.
- **Lote:** textarea `Nome;Cargo;Setor;Matrícula` por linha → navegação ‹ › e "Baixar lote (frente+verso)".
- **Export PNG @300 DPI** no tamanho exato.

## Configuração técnica (impressão PVC)
- 300 DPI; mm→px = 300/25,4 = 11,811.
- **Corte final 5,4×8,5 cm** = 638×1004 px. **Sangria 2 mm** → canvas **685×1051 px (5,8×8,9 cm)** — é o
  tamanho exportado. **Segurança 4 mm** a partir do corte (conteúdo dentro da linha verde).
- Export bate exatamente 685×1051 (html2canvas width/height fixos) — verificado (221ms).
- Canva: criar página 5,8×8,9 cm e colar o PNG a 100%; gráfica recebe o PNG com sangria.

## Catálogo
Nova plataforma `cracha` (ícone Contact, Imobiliária) no `pecasCatalog` — aparece sozinha no Estúdio de
Peças (data-driven). Correções de export do html2canvas reaproveitadas (sem inset:0; guias ocultas no
export; transform de preview separado do palco).

## Verificação (ao vivo)
lint + build OK. Editor renderizado; frente e verso fiéis ao brandbook (screenshots conferidos); QR
escaneável; export real **685×1051 px @300dpi** em 221ms.

Ver [[Atualizacao_2026-06-23_Estudio_Pecas_Comunicacao_Interna]].
