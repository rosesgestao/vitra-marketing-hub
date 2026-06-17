# Atualizacao 2026-06-17 — Build na Meta funcional E2E (Advantage+ Audience)

> O botao "Criar rascunho na Meta (pausado)" agora cria a campanha de ponta a ponta. Faltava 1
> parametro novo exigido pela Meta no conjunto. Na `main`. Commit: **506b541**.

## Erro
`Graph act_.../adsets: Invalid parameter — ... defina audience_advantage (targeting_automation)`.
A Meta passou a **exigir** a sinalizacao do **Advantage+ Audience** no targeting do ad set.

## Correcao
`publish-meta-ads/targetingFor` agora sempre envia `targeting_automation: { advantage_audience: 0 }` —
0 porque mandamos **publico explicito** (geo/interesses/custom), sem a expansao Advantage+. Uma linha,
no ponto unico onde o targeting e montado (vale para todos os conjuntos/objetivos).

## Verificacao (ao vivo, PAUSED, sem gasto)
Build real na campanha TOM MENINO DEUS / conta PoA: `ok, paused` — campanha + conjunto + criativo +
anuncio criados; `status` confirmou `effective_status: PAUSED` (R$20/dia). Depois **apagados** via
`delete_draft` (conta limpa). Tambem limpei o orfao da tentativa que falhou antes.

## Estado do fluxo de publicacao
Ponta a ponta funcional para a Imobiliaria: Aprovar -> painel (objetivo+conta+pagina+teto+**destino**+
extras) -> Criar rascunho (PAUSED) -> revisar no Gerenciador -> Publicar (ativar, com confirm). Lembrete:
**destino e obrigatorio** para qualquer objetivo (no leads_form vira follow-up). Ver
[[meta-ads-publicacao]].
