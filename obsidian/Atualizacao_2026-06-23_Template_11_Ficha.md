# Atualizacao 2026-06-23 — Template 11 "Ficha do imóvel" (referência do cliente)

> 11º template aprovado da Imobiliária, fiel ao conceito de uma referência visual fornecida. Na `main`. Commit: **a47e747**.

## Conceito (da referência)
**Fundo de cor sólida** + logo/headline/subtítulo no topo-esquerda + **cards de atributo** (ícone em tile
branco + barra com o texto) + **card de preço** + **galeria de 3 fotos à direita** + **rodapé de
contato/CTA**. A referência é de **marca concorrente** — usei apenas estrutura/conceito; **não** copiei
logo, textos nem contatos.

## Adaptação de marca (Vitra Imobiliária)
Fundo **navy** (no lugar do azul da referência), **wordmark VITRA**, **preço em dourado** (o acento da
marca, traduzindo o "preço na cor da marca"), ícones de linha **navy** em tiles brancos, barras navy,
**régua dourada** no divisor do rodapé. Headline em **Poppins 700**, subtítulo Poppins 500.

## Implementação
- **Edge** (`render-asset`): `buildVitraFichaSvg` — bg navy gradiente; cards = tile branco + ícone navy +
  barra navy; **ícone escolhido por palavra-chave** (`fichaIconKind`: suíte→cama, vaga→garagem,
  piscina→pool, m²→área/régua, bairro→pin, churrasq→grill, senão→check) com `fichaIconSvg` (set de ícones
  de linha); card de preço dourado; galeria 3 fotos (`duoSelosPhoto`); rodapé CTA + régua dourada + contato.
  **3 formatos** com composição própria (1:1, 9:16, 1.91:1) + safe zone. Rodapé omitido no 1.91:1 (formato
  curto). Dispatch + allowlist + `maxTemplateImages=3`.
- **Catálogo**: família `vitra-imobiliaria-ficha-imovel` (11ª da Imob), `fieldGroups` (headline, localização,
  atributos 4, preço, cta, telefone, site), `imageSlots` (3 galeria), `variationContract` (5 recipes),
  `renderVersion: ficha-imovel-approved-v1`, 6 previews. Espelho `renderVersions.ts`; guard test
  (11 imob / 7 selecionáveis).

## Verificação (ao vivo)
deno check + lint + **164 testes** + build; deploy CLI. 3 formatos renderizados (assets temporários com 3
fotos via slots, depois removidos) — 1:1, 9:16 e 1.91:1 conferidos contra a referência: fundo navy, headline
"Sobrado", 4 cards de atributo com ícones corretos, preço dourado "R$ 950 mil", galeria, rodapé com contato.
Safe zone ok. 6 previews em public/generated/vitra-imobiliaria. Marca: Imobiliária.

Ver [[Atualizacao_2026-06-23_Template_10_Oportunidade]].
