# Atualizacao 2026-06-23 — Per-placement habilitado no leadgen (3 formatos no anúncio)

> Anúncios de formulário usavam só o 1:1; agora usam feed/story/wide por posicionamento. Na `main`. Commit: **<HASH>**.

## Causa exata
No P1 (item 108) eu **desabilitei o per-placement para o objetivo de formulário** (`isLeadForm`), porque a
primeira tentativa de `asset_feed_spec` recusou o lead form (eu havia posto `lead_gen_form_id` em `link_urls`,
chave errada). Como a campanha do Murano é **Leads (formulário)**, ela caía no caminho de **imagem única**
(corte feed) — a Meta então adaptava esse 1:1 a todos os posicionamentos (o que o print mostra). Os cortes
9:16 e 1.91:1 eram gerados/salvos/aprovados, mas **nunca anexados** ao anúncio.

## Etapa onde os formatos se perdiam
No `build_draft`, na decisão do criativo: `if (perPlacement && !isLeadForm && roles.length>=2)`. O
`!isLeadForm` jogava todo leadgen para `singleImageCreative` (1 imagem).

## Correções (back-end, Edge publish-meta-ads)
1. **Removido o gate `!isLeadForm`** → per-placement vale p/ todos os objetivos com ≥2 formatos.
2. **Lead form pela via correta do `asset_feed_spec`**: `call_to_actions:[{type, value:{lead_gen_form_id,
   link}}]` (em vez de `lead_gen_form_id` no lugar errado).
3. **`link_urls` sempre presente** — a Meta recusa o `/ads` de personalização de ativos sem link
   ("Anúncios de personalização de ativos precisam de um link").
4. **base64 em chunks** no upload de imagem (`/adimages`): a conversão char-a-char de PNGs de ~2MB
   estourava o compute do edge (WORKER_RESOURCE_LIMIT) com vários cortes; chunked resolve.

## Regra formato × posicionamento (asset_customization_rules)
- **9:16 (story)** → facebook story/reels; instagram story/reels.
- **1.91:1 (wide)** → facebook right_hand_column/search.
- **1:1 (feed)** → regra default (feed/marketplace/perfil; stream/explore/perfil). Cobre o restante.
- Fallback seguro: se a Meta recusar o asset_feed_spec, cai p/ imagem única (build nunca quebra).

## Verificação (ao vivo, builds PAUSED + apagados)
- 1 conceito (3 uploads): ok, per_placement. 2 conceitos (6 uploads, o que estourava): **ok, ads:2,
  sem fallback**. Banco confirmou `per_placement:true`, `formats:[feed,story,wide]` nos 2 anúncios.
- 4 rascunhos de teste criados e **apagados**; a campanha real do usuário (Cidade POA + Regional 2km)
  foi preservada. deno check; deploy CLI.

## Critérios de aceite
Anúncio leadgen criado com asset_feed_spec, 3 formatos mapeados aos posicionamentos, per_placement=true,
form funcionando, sem usar 1:1 indiscriminadamente; build resiliente (fallback) e sem OOM.

Ver [[Atualizacao_2026-06-23_Per_Placement_IG_e_Render_3_Formatos]] e [[Atualizacao_2026-06-23_Criativo_Por_Posicionamento_P1]].
