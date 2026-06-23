# Atualizacao 2026-06-23 — Endomarketing: +3 modelos (aniversariantes, comunicado, metas)

> Amplia a categoria Comunicação Interna com 3 novos geradores. Na `main`. Commit: **6d719c9**.

## Entregue
Três novos geradores em `public/pecas`, registrados na categoria **Comunicação Interna** (`pecasCatalog`,
Imobiliária), todos **multiformato** (Feed 4:5 · Stories/Status 9:16 · Post 1:1), textos editáveis ao vivo,
upload de foto opcional e export PNG por formato:
- **Aniversariantes do mês** (`aniversariantes-interno-…`): lista editável (dia + nome), mês em destaque,
  mensagem de felicitação, confetes dourados sutis.
- **Comunicado interno** (`comunicado-interno-…`): selo "Comunicado", título (Playfair), régua dourada,
  corpo da mensagem e assinatura/De — formal e limpo.
- **Metas batidas** (`metas-interno-…`): número/percentual gigante em dourado, rótulo da meta, "Parabéns,
  time!" e mensagem de agradecimento — centralizado, celebratório.

Identidade Imobiliária em todos: navy #0A1628 + dourado #C4942A, Inter/Playfair, logo "V" faceto, fita
dourada no topo. Construídos sobre o esqueleto já validado do `evento-interno`, com **todas as correções de
export do html2canvas embutidas** (sem `inset:0`; `exportPeca` zera o transform inline do `.frame`; sem
conic-gradient nem linha-gradiente de 2px; `white-space:nowrap` nos títulos; SVG com width/height).

## Verificação (ao vivo)
lint + build OK. Os 3 geradores carregados no preview; PNG real rasterizado e conferido por screenshot —
**1080×1350 em todos, layout íntegro, sem sobreposição**. Categoria mostra agora 4 modelos.

Ver [[Atualizacao_2026-06-23_Estudio_Pecas_Comunicacao_Interna]] e [[Atualizacao_2026-06-23_Fix_Export_PNG_Evento_Interno]].
