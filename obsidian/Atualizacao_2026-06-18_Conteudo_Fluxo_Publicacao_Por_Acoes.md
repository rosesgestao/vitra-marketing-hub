# Atualizacao 2026-06-18 — Conteúdo: fluxo de publicação por AÇÕES (criar→aprovar→agendar→publicar)

> A aba Produção foi reorganizada em torno do funil editorial. O operador deixa de escolher um status
> cru num dropdown de 7 opções; o status passa a ser DERIVADO da ação. "Marcar publicado" tambem
> registra a publicacao real (destrava metricas). Na `main`. Commit: **28ebbdf**.

## Diagnostico (PO + dev senior)
A aba misturava criar + um tracker plano: unico jeito de criar era "Gerar com IA"; cada linha tinha um
dropdown de 7 status + data sempre vazia; "publicar" existia em 2 lugares (linha + aba Publicações). As 5
etapas (planejar/criar/aprovar/agendar/publicar) estavam fundidas e o status interno vazava pro usuario.

## Entregue (Fases 1+2+3)
- **Entrada dupla "Novo conteúdo":** toggle *Gerar com IA* | *Criar do zero* (form manual:
  titulo/legenda/CTA/hashtags + tipo/pilar/formato/plataforma). Reusa `createContentPost`.
- **Board por AÇÕES:** cada card mostra um **chip de etapa** (Rascunho→Aprovado→Agendado→Publicado,
  derivado do status) e **so o botao da proxima acao**: `Aprovar` → `Agendar` (revela a data) →
  `Marcar publicado`. Data **so aparece ao agendar** (nao mais campo vazio em toda linha). Ordena por
  etapa (itens que pedem acao primeiro); "voltar a rascunho" como escape. Fim do dropdown de 7 status.
- **Publicar UNIFICADO:** `publishContentPost` marca o conteudo como publicado **e** cria a linha em
  `premium_publications` (idempotente: se ja existe, so atualiza o link) — destrava metricas por peca sem
  abrir a aba Publicações. `createManualPublication` agora aceita conteudo de marca (sem oferta) e grava
  `brand_scope` em **metadata** (a coluna e GENERATED `COALESCE(metadata->>'brand_scope','vitra_premium')`).
- **migration** `premium_publications.campaign_id` nullable (espelha premium_content_posts).
- **Header da secao organica:** acao primaria virou **"Novo conteúdo"** (vai ao bloco de criacao);
  criar oferta vira secundaria **"Nova oferta"**. "Nova campanha" fica so no Tráfego Pago.

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview (Conteúdo Imobiliária): entrada dupla, header novo, chips de etapa
e botoes de acao renderizados. **E2E**: criei um rascunho manual → **Aprovar** (DB: status=approved) →
**Marcar publicado** (prompt com link) → DB: post `published` + **publicacao criada automaticamente**
(`organic`, permalink, `brand_scope=vitra_imobiliaria` correto via metadata, `source=content_publish`).
Zero erro no console. Dados de teste removidos via service-role.

## Bug pego na verificacao
1a tentativa de publicar falhou: eu inseria `brand_scope` como coluna, mas ela e GENERATED -> "cannot
insert a non-DEFAULT value". Corrigido movendo `brand_scope` para `metadata`.

## Recomendacao registrada (a favor)
Fluxo por funil de ACOES (status derivado), publicar unificado ao registro de metricas, e Produção
focada em criar + agir — delegando o pipeline completo ao board **Conteúdos** e ao **Calendário** (uma
fonte, varias lentes). Continuacao de [[Atualizacao_2026-06-17_Conteudo_Oferta_Vinculada_Contextual]].
Ver [[conteudo-organico]].
