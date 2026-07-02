# Etapa 8 (parte) — guard catálogo↔schema (governança) (2026-07-02)

Fecha a pendência de governança anotada na Etapa 3: o enforcement AUTOMÁTICO de "nenhum template
selecionável sem schema". Antes o guard era uma lista fixa de 6; agora cruza com o catálogo REAL.

## Entregue
- Teste `templateSchemas.test.js`: `selectableCreativeTemplatesForBrand('vitra_imobiliaria')` (catálogo
  real, filtra `hidden`) → cada `.family` DEVE ter `schemaFor(...)`. Se alguém adicionar um selecionável
  novo sem schema, o teste (e o CI) reprova. Substitui o guard de lista hardcoded (que driftava).
- Regra de governança do sistema determinístico: **um template só vira selecionável com schema** (contrato
  + zonas). O schema, por sua vez, exige arquétipo/componentes/campos/lint/dsVersion (validados pelos
  outros testes de schema). Assim, "selecionável" implica "coberto pelo gate".

## Verificação
237 testes (o guard agora passa contra o catálogo: 6 selecionáveis, todos com schema) + ESLint OK.

## Governança — o que já é enforçado por código
- selecionável ⟹ tem schema (este guard).
- schema ⟹ arquétipo válido + campos com charLimit + dsVersion atual (testes de schema).
- catálogo ⟷ renderVersions em sync (teste templateCatalog existente).
- render ⟹ grava `render_trace` (ds_version/template_version/arquétipo/decisão) — auditável (Etapa 5).

## Restante da Etapa 8 (documental, não bloqueia)
Ciclo de vida formal (draft → harness verde com N fixtures → aprovação visual registrada → selecionável),
changelog do DS_VERSION, cadência de revisão do brandbook, papéis de aprovação (técnica=CI / visual=PR).
Já documentado na [[Spec_Sistema_Deterministico_Criativos|spec, §8]]; a parte AUTOMÁTICA (guards) está feita.

## Estado da spec
Etapas 1-5 ✅ + Etapa 8 (guard automático) ✅. Restam maiores: **6** (harness expandido: curto/médio/longo
/vazio + preço + imagem H/V/Q × Premium + baseline de métricas), **7** (regressão visual golden pixel-diff
no CI). Pendências menores da E4: estender contraste às outras 5 + foto, format_divergence, promover
logo_crowding a erro. [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
