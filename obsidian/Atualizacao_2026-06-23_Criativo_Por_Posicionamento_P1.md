# Atualizacao 2026-06-23 — P1 Criativo por posicionamento (asset_feed_spec)

> O build passa a usar a ARTE CERTA por posicionamento (feed/story/wide) em vez de 1 imagem recortada. Na `main`. Commit: **43436a5**.

## Diagnóstico que originou
O `build_draft` anexava **1 imagem por anúncio** (`link_data.picture`) e a Meta recortava sozinha para todos
os posicionamentos. As artes 9:16 (story) e 1.91:1 (wide) renderizadas **não eram usadas**.

## O que mudou (build_draft)
- **1 anúncio por CONCEITO** (antes: 1 por corte). `conceptsFor` agrupa os cortes por `ad_label` e mapeia
  formato→papel (`fmtRole`): 1:1/4:5→feed, 9:16→story, 1.91:1→wide.
- **Criativo por posicionamento** via `asset_feed_spec` + `asset_customization_rules`: cada arte é exibida
  no seu local (story em stories/reels; wide na coluna direita/pesquisa; feed como regra base). Imagens
  enviadas à conta (`/adimages` → hash) e referenciadas por `adlabels`.
- **Fallback seguro:** se a Meta recusar o `asset_feed_spec`, publica com a imagem feed única — o build
  **nunca quebra**. Conceito com só 1 formato → imagem única + nota "renderize 9:16 e 1.91:1".
- **Leadgen:** objetivo de formulário **não** suporta `asset_feed_spec` (o `lead_gen_form` só anexa no
  criativo de imagem única). Nesses casos mantém imagem única + nota "a Meta adapta para os demais
  posicionamentos". Per-placement vale para tráfego/vendas/reconhecimento.
- Resposta por conjunto ganha `placement_notes`; cada publicação grava `per_placement` + `formats`.

## Verificação (curl ao vivo + limpeza)
- Bug corrigido em iteração: `(#100) Invalid keys` vinha do `lead_gen_form_id` dentro de `link_urls` —
  removido. Depois disso o **criativo asset_feed_spec passou a ser ACEITO** (os erros restantes acontecem
  só no `/ads`: pixel p/ conversões e conta-IG p/ posições IG — wiring por objetivo, fora do P1).
- Leadgen (caso real do Murano): build OK, `ads:1`, imagem única + nota informativa — verificado.
- 8 rascunhos PAUSED de teste criados nas validações e **apagados** (delete_draft). Nada ativado, nada gastou.
- deno check OK; deploys via CLI.

## Pendências operacionais / próximos
- **Render dos 3 formatos:** hoje os cortes 9:16 estão sem `public_url` (não renderizados) e alguns 1.91:1
  também — para o per-placement ter efeito é preciso renderizar os 3 (botão "Renderizar" / pipeline).
- **IG actor** no `asset_feed_spec` (posições Instagram em objetivos não-leadgen): anexar `instagram_actor_id`.
- **Per-placement em leadgen:** exige caminho específico de form na Meta (a avaliar).

Ver [[Atualizacao_2026-06-23_Copy_Descricao_Obrigatoria_P0]].
