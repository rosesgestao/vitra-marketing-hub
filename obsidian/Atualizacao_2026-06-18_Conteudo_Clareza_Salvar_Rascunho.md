# Atualizacao 2026-06-18 — Conteúdo: clareza do "Salvar rascunho" (feedback + próximo passo)

> Análise do fluxo "Gerar posts" → "Salvar rascunho": a mecânica já era correta (rascunho em
> premium_content_posts → funil → aprovar/agendar/publicar), mas FALTAVA feedback de "para onde foi" e
> qual o próximo passo. Resolvido. Na `main`. Commit: **2508911**.

## Diagnostico (PO + dev senior)
Ao salvar, a unica mudanca era o texto do botao ("Salvo no board" — jargao). O item ia para o funil BEM
ABAIXO, sem aviso/rolagem/destaque; as 3 ideias da IA (efemeras) pareciam iguais ao board e somem ao
regenerar; o proximo passo nao era "empurrado".

## Entregue (itens 1-4)
- **Confirmacao + para onde foi:** banner "Rascunho salvo em 'Conteúdos em produção' — abaixo. Próximo
  passo: Aprovar." (`savedNotice`, some em ~5s).
- **Rolar + destacar:** ao salvar, `flagSaved(saved)` guarda o id; um effect rola ate
  `#post-row-<id>` e aplica **ring dourado + badge "novo"** por ~3,5s.
- **Mais recentes no topo:** `sortedPosts` ordena por etapa e, dentro dela, por `created_at` desc — o
  rascunho recem-salvo aparece logo (visivel nos primeiros 15).
- **Sugestoes vs board:** bloco da IA rotulado **"Sugestões da IA (N)"** + aviso "as não salvas somem ao
  gerar novas"; botao **"Salvo no board" -> "Salvo em rascunhos"**.
- **Proximo passo + onde achar:** microcopy no funil **"Rascunho → Aprovar → Agendar → Publicar.
  Acompanhe também em Conteúdos (board) e Calendário."**

So UI (ContentProductionSection). Vale para os 3 caminhos (IA / manual / importar).

## Verificacao (ao vivo)
lint, 157 testes, build OK; console limpo. No preview: salvei um rascunho manual -> banner de confirmacao
apareceu; o item entrou no TOPO do funil com badge **novo**; a nota "Acompanhe também em Conteúdos e
Calendário" presente. Posts de teste removidos.

## Resta (1, entrega dedicada)
- **Publicação NATIVA via Graph** (IG/FB orgânico). Continuacao de
  [[Atualizacao_2026-06-18_Conteudo_Vinculo_Oferta_Contextual]]. Ver [[conteudo-organico]].
