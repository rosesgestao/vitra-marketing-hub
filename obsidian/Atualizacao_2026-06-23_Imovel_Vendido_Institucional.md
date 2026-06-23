# Atualizacao 2026-06-23 — Estúdio de Peças: "Imóvel Vendido" (Marketing Institucional)

> Peça de prova social de venda concluída, sem dados do imóvel/cliente. Na `main`. Commit: **1b5131c**.

## Decisão de PO
"Imóvel Vendido" é peça **institucional/mercadológica** (autoridade + prova social externa) — não é
endomarketing. Criada em **nova categoria "Marketing Institucional"** (`institucional`, ícone BadgeCheck,
Imobiliária), que abre espaço p/ futuras peças de autoridade (depoimento, marco/100 vendas, etc.).

## Modelo (gerador `imovel-vendido-institucional-vitra-imobiliaria.html`)
Multiformato (Feed 4:5 · Story 9:16 · WhatsApp 1:1). Identidade Imobiliária (navy gradient, dourado,
Inter/Playfair, logo V). Composição:
- Logo + eyebrow "Resultado".
- **Selo VENDIDO** (medalhão: anel dourado duplo + ícone V + "VENDIDO" + "Vitra Imobiliária") — celebra com
  elegância institucional.
- **Mensagem principal** por presets editáveis ("Mais um imóvel vendido", "Vendido pela Vitra Imobiliária",
  "Mais uma negociação concluída", "Mais um sonho realizado", + Outra/editar) → as variações.
- **Mensagem complementar** editável.
- Rodapé "Vitra Imobiliária · Porto Alegre" + slogan "Viva · Invista · Evolua".
- **Imagem de fundo** institucional opcional (upload/substituir) com overlay navy p/ legibilidade.
- **Sem campos** de endereço/valor/empreendimento/cliente — por design (não identifica imóvel/negociação).

## Campos
- **Obrigatório:** mensagem principal (vem preenchida).
- **Opcionais:** mensagem complementar, eyebrow, rodapé/slogan, imagem de fundo.

## Export
PNG por formato (Feed 1080×1350, Story 1080×1920, WhatsApp 1080×1080), com as correções de html2canvas do
esqueleto validado (sem inset:0; exportPeca zera transform inline; sem conic/linha 2px; SVG c/ w/h).

## Verificação (ao vivo)
lint + build OK. Preview conferido (selo VENDIDO + headline + complemento + rodapé/slogan, marca correta);
preset troca a mensagem; export real 1080×1350. Front: gerador estático + entrada no pecasCatalog
(data-driven). Back: nenhuma alteração.

Ver [[Atualizacao_2026-06-23_Cracha_Corporativo_PVC]].
