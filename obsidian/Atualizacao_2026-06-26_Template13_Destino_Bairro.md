# Atualização 2026-06-26 — Template 13: Bairro em destaque (pôster + condições)

Novo template do fluxo Tráfego Pago a partir de uma referência de **outro segmento** (viagens — pôster
de destino "Azul · Mendoza"), **adaptado estrategicamente ao mercado imobiliário**.

## Leitura da referência → adaptação
- **Nome do destino gigante (herói)** → o **BAIRRO/região** vira o nome em destaque (a localização é o
  que se vende). Régua dourada de acento sob o nome.
- **Subtítulo de lifestyle** → linha de estilo de vida do bairro (persuasiva, específica).
- **Painel "glass" com 2 condições da cia aérea (10x / 10% OFF)** → **2 condições do IMÓVEL**
  (financiamento/oferta): ex. "Até 120x direto" | "Entrada facilitada". Divisor central; cada coluna com
  destaque (número, Anton dourado) + descrição (Inter). Coluna 2 vazia → condição 1 centralizada.
- **Botão-pílula "Reserve agora!" com seta** → pílula branca "Agende sua visita" com seta em círculo navy.
- **Rodapé "*consulte condições"** mantido.
- **Avião** (elemento do segmento) → **removido**. **Azul** → **navy + dourado**. **Logo Azul** → wordmark
  **VITRA** oficial. Foto do destino → foto do imóvel na base, com gradiente navy no topo.

## Implementação
- **Edge `render-asset`**: `buildVitraDestinoBairroSvg` + helpers `destinoSplitHighlight` (separa o
  número-destaque do texto), `destinoConditionColumn`, `destinoCtaPill` (pílula + seta em círculo).
  Composição **própria por formato**: 1:1 e 9:16 centrados com foto-horizonte na base + gradiente navy
  sólido no topo; 1.91:1 com **coluna de conteúdo à esquerda e foto à direita** (véu horizontal). SAFE
  ZONE do Meta nos 3. Dispatch + allowlist + MODEL_LABEL + maxTemplateImages=1.
- **renderVersions + catálogo**: `destino-bairro-approved-v1`.
- **Catálogo**: family `vitra-imobiliaria-destino-bairro` (13º template, 9º selecionável) +
  `destinoBairroFieldGroups` (product_name, location=herói, suggested_headline=subtítulo, panel_title,
  condition_primary, condition_secondary, tag, cta) + `templateVariationContracts.destinoBairro` (6
  recipes com **copy imobiliária específica** — bairro-destino, lifestyle, condições de lançamento,
  entrada facilitada, pronto-perto, últimas unidades) + 6 previews.
- **Teste de guarda**: 13 templates / 9 selecionáveis.

## Verificação (render real, 3 formatos + correção)
deno check + lint + 164 testes + build OK; deploy via CLI. Renderizei os 3 formatos com conteúdo
imobiliário (bairro "Menino Deus", condições, selo "Lançamento"). **Bug encontrado e corrigido**: o
selo/tag renderizava ATRÁS do nome-herói → reposicionado para o canto superior (esquerda nos centrados,
direita no 1.91:1), fora da faixa do herói; re-deploy + re-render confirmaram. Resultado fiel ao conceito
da referência e às regras da marca (navy+dourado, Anton+Inter, wordmark VITRA, safe zone). 6 previews
(3 formatos × sem/com moldura) salvos; assets de teste removidos.

Commit: Edge (build + helpers + fix) + renderVersions + catálogo + teste + 6 previews.
