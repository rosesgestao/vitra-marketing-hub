# Atualizacao 2026-06-22 — Produção visual (Conteúdo) · Fase 2: grade + drawer + versões

> Reformula o board em grade thumbnail-first e unifica texto+arte num drawer "Prévia do post" (formato
> feed/story, versões, ações do funil). Na `main`. Commit: **8304ad6**.

## Entregue (Fase 2)
### Grade visual thumbnail-first
- As linhas densas do funil viraram uma **grade de cards** (`grid-cols-1 sm:2 lg:3`). Cada card lidera com a
  **arte** (imagem salva, ou **prévia ao vivo** do texto via `PostArtPreview` quando não há arte), + chips
  (etapa · marca/oferta · arte pronta/sem arte), título, **ação primária** do funil e botão **"Prévia"**.
  Clicar no card/thumb/título/Prévia abre o drawer.

### Drawer "Prévia do post" (`PostDetailDrawer`, substitui o antigo `PostArtModal`)
- **Arte:** abas Tipográfico/Com foto + **toggle de formato Feed 1:1 / Story 9:16** + canvas ao vivo +
  Salvar arte / Baixar PNG. Editar o texto **atualiza a prévia** em tempo real.
- **Versões:** histórico (`metadata.art_versions`, cap 6) em miniaturas; clicar **troca a versão ativa**
  (`setActivePostArt`, sem re-render), com destaque da ativa.
- **Texto no mesmo fluxo:** edita título/legenda/CTA/hashtags e **Salva** (persiste nas colunas).
- **Rodapé:** ações do funil (Aprovar/Agendar/Marcar publicado/voltar a rascunho) — fecha o drawer ao agir.

## Back-end (sem migração — tudo em colunas/jsonb já existentes)
- `updateContentPost` passa a aceitar **campos de texto** (title/hook/caption/cta/hashtags) além de status/agenda.
- `uploadPostArt` **empilha** em `metadata.art_versions[]` (a nova vira ativa).
- Novo `setActivePostArt(postId, url)` — define a versão ativa sem re-render.

## Verificação (ao vivo no preview)
- lint limpo · **162 testes** ✓ · build OK.
- Grade: **15 cards com 15 canvases** de prévia (screenshot). Drawer abre com arte+texto+ações; **toggle
  Story 9:16** re-renderiza o canvas em retrato (screenshot). Reload limpo renderiza tudo (os erros de HMR
  vistos no meio das edições eram de estados intermediários — sumiram no estado final).

## Estado
Produção agora é **visual e orientada ao resultado**: gerar (com prévia) → revisar/editar texto+arte no
drawer (feed/story, versões) → aprovar/agendar/publicar, com menos cliques e responsivo. Fecha a proposta de
2 fases. Ver [[Atualizacao_2026-06-22_Producao_Visual_Fase1]].
