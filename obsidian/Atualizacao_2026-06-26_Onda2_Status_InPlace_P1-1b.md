# Onda 2 (P1.1, fatia 2) — Mudar status do conteúdo no drawer (2026-06-26)

Completa o P1.1 ("telas acionáveis"): além de inspecionar (fatia 1), agora dá para **mudar o status** do
conteúdo direto no detalhe — sem ir à aba Produção. Lente da skill `ui-ux-pro-max` (submit feedback:
loading→sucesso/erro).

## Entregue
- `PostDetailDrawer`: seção **Status** com `VitraSelect` (7 status do modelo único: Rascunho → Em copy/
  design → Em revisão → Aprovado → Agendado → Publicado). Troca **otimista** (UI muda na hora) → grava via
  `updateContentPost(id,{status})` (mesma fonte da aba Produção) → **toast** de sucesso/erro (reverte a UI
  se falhar). A descrição do drawer reflete o status ao vivo.
- `Kanban` e `Calendário`: passam `onChanged` = re-fetch, então o board/calendário **se atualiza** após a
  troca (o card muda de lane). Calendário teve o `carregar` elevado para `useCallback` (estava preso no
  useEffect) para poder ser reusado como onChanged.
- Reusa o helper existente (sem novo back-end) e o modelo único de status (`contentPlaybook.ts`).

## Verificação (DOM real + banco)
- 69 cards no Kanban; abrir → drawer com **seletor de Status** (valor "Rascunho").
- **Round-trip** Rascunho → Em revisão → Rascunho: UI otimista muda na hora; toast "Status atualizado: …";
  banco confere `status='draft'` no fim (uma única linha) → **sem efeito colateral**.
- Aprendizado de verificação: na 1ª tentativa o revert falhou porque eu não esperei o write async concluir
  (`saving=true` desabilita o select) — restaurei e confirmei no banco. Padrão: aguardar o select reabilitar
  antes de agir de novo.
- lint limpo · **182 testes** · build OK.

## Estado do roadmap
Onda 1 (P0) ✅. Onda 2: P1.7 ✅ · **P1.1 (fatias 1+2) ✅**. Restam: P1.2 (geradores órfãos), P1.3 (copy IA
unificada), P1.4 (monolito), P1.5 (responsividade tablet), P1.6 (loop de métricas).

Commit: PostDetailDrawer (status in-place) + Kanban/Calendário (onChanged).
