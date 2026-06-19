# Atualizacao 2026-06-19 — Tráfego: painel de Presets + preparacao do build Azenha

> Fecha a UI do padrao "clonar a vencedora" e prepara o produto da Azenha. Na `main`. Commit: **e6386df**.

## Painel de Presets (Tráfego Pago)
`MetaPresetsPanel` (acima do "Revisar e publicar"): importa a config de uma campanha de REFERENCIA pelo
ID da campanha na Meta (`read_campaign_config`, read-only), normaliza num blueprint padronizado
(`presetBlueprintFromConfig`: age 25-65, raio regional ajustavel, cidade macro, FB+IG, 3x3, form por
ticket), mostra o resumo e SALVA como preset por marca; lista/exclui presets. Nao dispara build.

**E2E ao vivo:** importou a 30.05 -> blueprint "OUTCOME_LEADS · QUALITY_LEAD · CBO R$15/dia · 25-65 ·
regional 2km + cidade · form mais volume" -> salvou. Preset **"Padrão — TOM MENINO DEUS 30.05"** no banco.
lint/test/build verdes; console limpo.

## Preparacao do build — Azenha (Av. Dr. Carlos Barbosa 531, Azenha, POA, 90880-440)
Endereco geocodificado (Nominatim/OSM): **lat -30.0608422, lng -51.2115284** (em frente ao antigo Estadio
Olimpico). Criado o preset **"Padrão Lead Imóvel — Azenha (Carlos Barbosa 531)"** com esse ponto no
conjunto regional de **2 km** (Conj.2 = cidade POA). Ticket alto -> form **mais_volume (sem SMS)**.

## Blueprint pronto para publicar (Azenha)
- Campanha: `OUTCOME_LEADS`, `LOWEST_COST_WITHOUT_CAP`, **CBO R$15/dia**, PAUSED.
- Conj.1 REGIONAL: `geo=radius` lat -30.0608422 lng -51.2115284 **2km**, QUALITY_LEAD, age 25-65, FB+IG.
- Conj.2 MACRO: `geo=city` Porto Alegre (key 264859), QUALITY_LEAD, age 25-65, FB+IG.
- 3 criativos x 3 copies; form de Lead **mais volume** (sem confirmacao SMS) para ticket alto.

## Para ir AO VIVO (PAUSED) faltam inputs do operador (mesmo padrao seguro)
1. Criar a **campanha do produto Azenha** no dashboard (Nova campanha no Tráfego Pago) com os fatos do imovel.
2. Gerar e **APROVAR >=1 criativo** (idealmente 3 criativos x 3 copies) — o build so publica criativos aprovados.
3. No "Revisar e publicar": aplicar o blueprint do preset (objetivo/otimizacao/orcamento) e os 2 conjuntos
   geo (regional 2km no ponto + cidade POA) -> **build PAUSED**; **ativar exige confirm + clique** (gasta verba).

Pendencia tecnica menor: auto-semear o PublishMetaPanel a partir do preset (hoje o operador usa o blueprint
exibido como referencia). Ver [[Atualizacao_2026-06-18_Trafego_Preset_Fases2e3a]] e [[meta-ads-publicacao]].
