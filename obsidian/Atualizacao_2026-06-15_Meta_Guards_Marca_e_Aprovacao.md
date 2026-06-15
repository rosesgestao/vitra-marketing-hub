# Atualizacao 2026-06-15 — Meta: guards de marca + approved-only + cleanup

> Fechando um furo achado no 1o e2e: o build pegava criativo de TESTE e aceitava publicar campanha de
> uma marca na conta/Pagina de OUTRA. Agora o `publish-meta-ads` tem dois guards + uma acao de limpeza.
> Na `main`. Commit: **505c721**.

## O que motivou
No e2e de Lead (Louvre Gallerie 5 — campanha **Premium**), eu publiquei na **conta + Pagina da
Imobiliaria** -> preview com cabecalho "Vitra Imobiliaria" e criativo "VITRA PREMIUM". E o criativo era
um render `generated` de teste ("TAGLINE TESTE"), nao um aprovado. Dois furos: marca cruzada e criativo
nao-aprovado (eu furei o gate do painel chamando a edge direto).

## Entregue
1. **Guard de marca**: `build_draft` bloqueia se a conta/Pagina pertence a marca diferente da campanha
   (422 `brand_mismatch`). Mapa conta/Pagina->marca no edge (conta desconhecida nao bloqueia, para nao
   travar build legitimo). PoA/Zona Sul/Classificados=imobiliaria; 1057868298461356=premium; Pagina
   1509497485962089=imobiliaria.
2. **Approved-only**: so criativos `approved`/`published` vao ao ar (antes aceitava `generated`). Alinha
   o edge ao gate `readyAds` do painel; render de teste nao vaza. Sem aprovado -> 422
   `no_approved_creative` ("aprove ao menos 1 anuncio").
3. **`delete_draft`** (confirm:true): `DELETE` da campanha na Meta (cascateia conjuntos/anuncios) + limpa
   o banco; aceita `meta_campaign_id` explicito p/ orfaos. Helper `deleteMetaDraft` no front.

## Verificacao
deno check, lint, 151 testes, build OK; deploy. AO VIVO: build Premium+conta Imobiliaria ->
`brand_mismatch` (conta); Premium+conta Premium+Pagina Imobiliaria -> `brand_mismatch` (Pagina). Os 2
rascunhos de teste (120252587445910221 e 120252579208790221) apagados via `delete_draft` (200).

## Implicacao p/ proximo e2e LIMPO
Hoje **nenhuma campanha tem criativo `approved`** (todos `generated`/teste) -> o build (correto) recusa.
Para um e2e limpo: **aprovar 1 criativo no QA** e usar conta+Pagina da MESMA marca da campanha. Premium
precisa, ainda, de uma **Pagina Premium atribuida ao system user** (so a Imobiliaria esta hoje).

Continuacao de [[Atualizacao_2026-06-15_Meta_Fase2d_Formulario_Lead]]. Ver [[meta-ads-publicacao]].
