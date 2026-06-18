# Atualizacao 2026-06-18 — Conteúdo: "Gerar posts" e fim do "0 criativo(s) gerado(s)"

> O botao "Gerar criativos" da secao Conteúdo retornava sempre "0 criativo(s) gerado(s)". Causa raiz
> identificada e corrigida removendo a feature errada do lugar errado. Na `main`. Commit: **a71e262**.

## Causa raiz (por que dava 0)
A secao Conteúdo montava a `AssetsSection` com `scoped.assets.filter(a => a.channel !== 'meta_ads')`
(assets de template: Landing/Thumbnail/Stories/Carrossel/E-mail/WhatsApp/Reels) e mostrava "Gerar
criativos (13)". Mas o motor `renderCampaignAssets` -> `pendingRenderableAssetIds` filtra
**`.eq('channel','meta_ads')`** — so renderiza criativo de **Meta Ads**. Interseccao = vazia -> **0
renderizados** -> "Renderização concluída: 0 criativo(s) gerado(s)". Contradicao embutida: a tela exibia
exatamente os assets que o render, por design, ignora.

## Diagnostico de produto
`render-asset` (Satori/Resvg) e o **renderizador de criativo de TRAFEGO PAGO**, nao gera post organico.
A secao Conteúdo e ORGANICA: o entregavel e o **post (texto)** — ideia/legenda/CTA/hashtags/formato/
status/agendamento — produzido pelo fluxo de **IA editorial** (`generate-content`) que ja vira card no
funil. A matriz de criativos + "Gerar criativos" eram resquicio de quando Conteúdo & Campanhas eram a
mesma secao (contaminacao pago<->organico).

## Entregue (escopo "limpar + renomear", escolha do Leonardo)
- **Removida a `AssetsSection` (matriz + "Gerar criativos") da secao Conteúdo.** A aba Produção fica so
  com o post: Criar (IA/manual) -> Aprovar -> Agendar -> Publicar; o card e a visualizacao.
- **Geracao organica = "Gerar posts"** (renomeado de "Gerar com IA"); ja funcional (texto + formato ->
  funil). O "0 gerados" e impossivel agora (nao ha render pago no organico).
- **Render de arte continua no Trafego Pago/Estudio** (la a acao e "Gerar cortes"); intacto.

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview: secao Conteúdo sem matriz de assets e sem "Gerar criativos";
"Gerar posts" + funil presentes. Tráfego Pago manteve "Gerar cortes"/Estúdio — nada quebrado, zero erro
no console. (A funcao `AssetsSection` ficou sem uso no arquivo — candidata a limpeza futura.)

## Decisao de produto adiada
Post organico precisa de IMAGEM (hoje a IA so da a direcao visual). "Gerar arte do post" (imagem branded
a partir do texto, reusando render/`vitra-design`) e feature separada — NAO e o que o "Gerar criativos"
fazia. Fica como follow-up. Continuacao de
[[Atualizacao_2026-06-18_Conteudo_Fluxo_Publicacao_Por_Acoes]]. Ver [[conteudo-organico]].
