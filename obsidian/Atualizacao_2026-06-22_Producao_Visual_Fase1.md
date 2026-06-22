# Atualizacao 2026-06-22 — Produção visual (Conteúdo) · Fase 1: prévia + arte integrada

> A aba Produção deixa de ser text-only: prévia da arte nos cards de sugestão, "Gerar arte" em destaque
> com status, e arte gerada automaticamente ao aprovar. Na `main`. Commit: **<HASH>**.

## Contexto (diagnóstico)
A Produção gerava só texto; o usuário aprovava sem ver o resultado. "Gerar arte" era um link apagado
(`text-white/45`) escondido no canto de uma linha densa do funil. Proposta aprovada em 2 fases — **Fase 1**
(prévia integrada + arte em destaque + auto-arte) entregue agora; **Fase 2** (grade visual + drawer + versões)
fica para a próxima entrega.

## Entregue (Fase 1)
- **Prévia da arte nos cards de sugestão.** Novo `PostArtPreview` (Canvas 2D reusando `renderPostArtToCanvas`)
  renderiza a arte branded ao lado da legenda de cada sugestão da IA — atualiza ao editar a legenda. O
  operador vê o resultado **antes de salvar/aprovar**.
- **"Gerar arte" promovido** na lista do funil: era link apagado, virou **botão dourado** (quando falta arte)
  + **chip de status** "SEM ARTE" (âmbar) / "ARTE PRONTA" (verde) por card.
- **Auto-arte ao aprovar:** `approve()` gera e salva a arte automaticamente quando o post não tem (best-effort
  — a aprovação não falha se a arte falhar). Gated pela flag editorial **`auto_art_on_approve`** (padrão ligado).
- **Configurações editoriais:** toggle "Gerar arte ao aprovar" (persistido em `premium_editorial_settings`).
- Helper `artOptsFor(...)` monta o `artOpts` do `postArt.js` a partir de uma sugestão OU de um post salvo.

## Back-end
- Migration aditiva: `premium_editorial_settings.auto_art_on_approve boolean default true`
  (`supabase/migration-editorial-auto-art.sql`, aplicada via MCP).
- `saveEditorialSettings(..., { autoArtOnApprove })`. Sem novo edge — a arte é Canvas no cliente
  (`postArt.js`), salva via `uploadPostArt` (storage `cards` + `art_url` no metadata + registro na Biblioteca).

## Verificação (ao vivo no preview)
- lint limpo · **162 testes** ✓ · build OK · console sem erros.
- Geração: 3 sugestões com **3 canvases de prévia** renderizados (screenshot).
- Funil: chip "SEM ARTE" + botão dourado "Gerar arte" em todas as linhas.
- **Auto-arte ao aprovar** confirmado por rede **e** banco: aprovar → upload no storage (200) → PATCH
  `art_url` (204) → registro DAM (201) → reload; post `51c18d92` ficou `approved` + `has_art=true`.

## Pendente / Fase 2
Grade visual thumbnail-first + drawer "Prévia do post" (texto+arte, feed/story, versões, comparação),
redução de cliques no board e responsividade refinada. Ver [[Atualizacao_2026-06-19_Porta_InApp_Vitra_Copy]].
