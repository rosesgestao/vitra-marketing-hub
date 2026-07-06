# Catálogo — remover 4 templates não aprovados da seleção do modal — 2026-07-06

A pedido do Leonardo, ocultados da seleção (Catálogo de Templates, modal "Nova campanha") 4 templates da
Vitra Imobiliária que **não foram aprovados**:
- **Vitrine alto padrão** (`vitra-imobiliaria-vitrine-gallery`)
- **Ficha do imóvel** (`vitra-imobiliaria-ficha-imovel`)
- **Oferta com preço-âncora** (`vitra-imobiliaria-oferta-ancora`)
- **Bairro em destaque (pôster)** (`vitra-imobiliaria-destino-bairro`)

## Como
Padrão do projeto: `hidden: true` em cada template no `creativeTemplateCatalog.js`. Some da seleção
(`selectableCreativeTemplatesForBrand` filtra `hidden`), MAS continua no catálogo para que campanhas/assets
já criados com a family **resolvam e renderizem** (sem referências órfãs). Nenhum dado/arte/render alterado.

## Resultado
Imobiliária: **7 → 3** selecionáveis no modal (`hero-checklist`, `duo-selos-offer`, `checklist-rail`).
Ocultos: **7 → 11**.

## Testes-guarda atualizados
- `templateCatalog.test.js`: lista aprovada 7→3; ocultos 7→11 (comparação **ordem-independente**, sort dos
  dois lados — mais robusta a reordenações futuras).
- `templateSchemas.test.js`: limiar `>= 6` → `>= 3`; título "as 6 selecionáveis" → "as 6 famílias com
  schema" (os schemas/lint dos ocultos permanecem — necessários para renderizar assets já criados).

## Verificação
lint + 278 testes + build (verdes). Tela atrás do login → Leonardo validou. Commit `691751e`.

[[Atualizacao_2026-07-06_Catalogo_Templates_Preview]]
