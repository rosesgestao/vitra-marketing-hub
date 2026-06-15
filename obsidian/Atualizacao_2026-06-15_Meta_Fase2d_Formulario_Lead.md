# Atualizacao 2026-06-15 — Meta fase 2d: formulario instantaneo de Lead

> O objetivo **Leads (formulario)** saiu do 🔒. Com o ToS de Lead aceito na Pagina, o agente monta uma
> campanha com **formulario instantaneo na propria Meta** (nome, e-mail, telefone) — sem mandar pro
> site. Tudo PAUSED + gate, como o resto. Na `main`. Commit: **bd021de**.

## Pre-requisito (resolvido p/ Vitra Imobiliaria)
ToS de Lead aceito por admin em facebook.com/legal/leadgen/tos. Lido com o NOSSO token
(`META_ACCESS_TOKEN`): Pagina **Vitra Imobiliaria** (`1509497485962089`) -> `leadgen_tos_accepted:true`.
A leitura via token do MCP dava `false` (visao limitada) — o que vale e o nosso token, que e quem cria
o anuncio. Outras marcas (Premium/Classificados/Zona Sul) ainda nao estao atribuidas ao system user.

## Entregue
- **Playbook**: `leads_form.available = true` (o pre-requisito vira validacao em runtime, nao trava de UI).
- **`publish-meta-ads`** (quando `optimization_goal === LEAD_GENERATION`):
  - valida `leadgen_tos_accepted` da Pagina em runtime; se falso/inacessivel -> **422 `leadgen_tos_pending`
    acionavel ANTES de criar qualquer objeto**;
  - `ensureLeadForm` — garante/reusa (idempotente por nome) um `POST /{page_id}/leadgen_forms` basico
    (FULL_NAME/EMAIL/PHONE, pt-BR, Politica de Privacidade obrigatoria, follow_up p/ o destino);
  - conjunto `destination_type: ON_AD` + `promoted_object:{page_id}`; criativo com
    `call_to_action.value.lead_gen_form_id` (abre o form na Meta).
- **Front**: `buildMetaDraft` aceita `privacyPolicyUrl`; `PublishMetaPanel` mostra o campo **Politica de
  Privacidade** so no objetivo de formulario (usa o destino se vazio).

## Verificacao
deno check (2 edges) OK, lint, 151 testes, build OK; edges deployadas. Guard testado AO VIVO: build_draft
`leads_form` numa Pagina inacessivel -> `422 leadgen_tos_pending`, **sem criar nada** (o guard dispara
antes da campanha). Caminho positivo (cria form real + objetos pausados) fica para o operador disparar
numa campanha escolhida.

## Resta
- **leads_retrieval** no token (regerar marcando o escopo) para BAIXAR os leads + Acesso Avancado do app
  para producao.
- **Outras marcas**: atribuir a Pagina ao system user `Vitra Agentes Bot` (so a Imobiliaria esta hoje).
- **Vendas/Conversoes**: ainda 🔒 (precisa de pixel).

Continuacao de [[Atualizacao_2026-06-15_Meta_Fase2e_Objetivos_Flexiveis]]. Ver [[meta-ads-publicacao]].
