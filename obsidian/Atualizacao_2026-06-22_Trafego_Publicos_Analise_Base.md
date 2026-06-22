# Atualizacao 2026-06-22 — Tráfego: análise de Públicos Personalizados (referência) + base backend

> Análise das campanhas de referência + fundação de backend para o seletor de públicos. Na `main`. Commit: **<HASH>**.

## Achado principal (gestor de tráfego)
As campanhas de referência **TOM 30.05 (`120240689084870221`)** e **10.06 (`120252147584340221`)** —
as vencedoras — **NÃO aplicaram nenhum Público Personalizado** nos conjuntos. `read_campaign_config`
(estendido) confirmou `custom_audiences=[]` e `excluded_custom_audiences=[]` em todos os conjuntos.
Estrutura vencedora = **geo (raio + cidade) + idade 25–65 + formulário de lead**, segmentação aberta.
→ Públicos personalizados devem ser **camada OPCIONAL** no fluxo, **não** padrão (o padrão segue o vencedor).

## Inventário de públicos da conta (122035585232240) — ATIVOS úteis
- **Lookalike (ativo):** "Semelhante (BR,1%) - PÚBLICO QUENTE ORYGEM" (~1,4–1,6M); "Semelhante (1%) - +75% vídeo TOM" (~1k).
- **Engajamento (ativo):** "PÚBLICO QUENTE ORYGEM", "+75% vídeo 2393-FR/TOM", "PESSOAS QUE VISUAL. VIDEO FREE 95%".
- **Seguidores/Página (ativo):** "SEGUIDORES VITRA - FACEBOOK" (~12–14k), "SEGUIDORES VITRA" (IG ~4,6–5,4k),
  "VITRA ENGAJ - 365D" (~2,2–2,6k), "ENGAJ ANUNCIOS - 365D" (~1,1–1,3k), "ENGAJ VITRA - PÁGINA FACEBOOK".
- **Lista/Formulário (ativo):** "MAILIND 2D GERAL csv" (CUSTOM, lista), "ABRIRAM N ENVIARAM FORM 3 SUITES" (form).
- Dezenas de lookalikes/listas **INACTIVE** (não entregam) — devem ser filtradas no seletor.

## Origem por tipo (mapeada)
LOOKALIKE = semelhante · ENGAGEMENT = engajamento (vídeo/anúncio) · PLATFORM = IG/FB (seguidores, form de lead,
remarketing) · CUSTOM = lista de clientes (csv). WEBSITE/pixel: não há ativo relevante (conta sem pixel forte).

## Recomendação (opções reutilizáveis = presets de público)
1. **Excluir leads existentes** (EXCLUIR): "DADOS FORMULÁRIOS ENVIADOS - VITRA" + "ABRIRAM N ENVIARAM FORM 3 SUITES"
   → não gastar com quem já converteu/está no funil. **Maior valor**, seguro, aplicável a qualquer campanha de lead.
2. **Semelhante quente** (INCLUIR): "Semelhante (BR,1%) - PÚBLICO QUENTE ORYGEM" — alcance grande, topo de prospecção.
3. **Aquecidos** (INCLUIR, p/ conjunto de retarget): engajamento + seguidores + vídeo.
Regra de ouro: **incluir e excluir o mesmo público é proibido**; só públicos **ACTIVE** e com tamanho suficiente.

## Entregue agora (base de backend — sem UI ainda)
- `read_campaign_config` passa a capturar `custom_audiences` e `excluded_custom_audiences` por conjunto
  (base do preset reutilizável + da análise).
- `build_draft`/`targetingFor` passa a aceitar **incluir N** (`custom_audience_ids` + legado `custom_audience_id`)
  e **excluir N** (`excluded_custom_audience_ids`), com dedup e regra "não incluir+excluir o mesmo".
- deno check OK; deploy via CLI.

## Pendente (UI — próxima entrega)
Seletor de públicos por conjunto no `PublishMetaPanel`: multi-include + multi-exclude, lendo só os públicos
**ACTIVE** da conta selecionada (`listMetaAudiences`), exibindo nome/tipo/origem/tamanho; presets acima;
validações (overlap, indisponível/volume baixo); mensagens de erro. `manage-audiences/list` já existe.

Ver [[Atualizacao_2026-06-22_Trafego_2_Conjuntos_Localizacao]] e [[meta-ads-publicacao]].
