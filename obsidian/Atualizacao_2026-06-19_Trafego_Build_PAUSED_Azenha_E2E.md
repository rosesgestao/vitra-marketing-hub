# Atualizacao 2026-06-19 — Tráfego: build PAUSED Azenha (E2E do preset) + verificacao na Meta

> Rodamos o build PAUSED do produto da Azenha a partir do preset (geo raio 2km + cidade), validamos a
> estrutura direto na Meta e limpamos. So validacao — sem codigo novo, sem gasto.

## Fluxo executado
1. **Campanha criada** (via SQL, pois o modal "Nova campanha" nao concluiu no headless): "Residencial
   Azenha 531 (Carlos Barbosa)", brand_scope imobiliaria, + **1 criativo `meta_ads` APROVADO de TESTE**
   (placeholder: imagem 1:1 emprestada de outra campanha Imob, copy generica valida). campaign_id
   9ef58855-...
2. **build_draft** (edge publish-meta-ads) com o blueprint do preset Azenha: objetivo `leads_form`, conta
   PoA 122035585232240, Pagina Vitra Imobiliaria 1509497485962089, CBO R$15/dia, ad_sets = [regional
   geo=radius 2km lat/lng Azenha; macro geo=city POA 264859], age 25-65, FB+IG.
3. Resultado: **meta_campaign_id 120252930267170221, 2 conjuntos, tudo PAUSED, zero gasto.**

## Verificacao na Meta (read_campaign_config) — CONFERE
- Campanha: OUTCOME_LEADS, AUCTION, LOWEST_COST_WITHOUT_CAP, **CBO R$15/dia**.
- Conj. **Regional**: geo **radius_point raio 2 KILOMETER em -30.0608422, -51.2115284** (Azenha), age 25-65, FB+IG, LEAD_GENERATION.
- Conj. **Macro**: geo **city key 264859 (Porto Alegre)**, age 25-65, FB+IG, LEAD_GENERATION.
- **Lead form** criado: id 1032034369391030, pt_BR, FULL_NAME/EMAIL/PHONE, **is_optimized_for_quality=false
  ("mais volume"/sem SMS)** — coerente com ticket alto.

## Limpeza
`delete_draft` apagou a campanha Meta (cascata conjuntos/anuncios) — **nada ficou na conta**. Removidos
tambem os rows de teste (premium_campaigns/_assets/_publications). NOTA: o leadgen form 1032034369391030
fica na Pagina (orfao inofensivo; Graph nao cascateia form no delete da campanha).

## Achados (gestor de trafego)
- O build saiu com `optimization_goal=LEAD_GENERATION` (do objectivePlaybook). A referencia 30.05 usa
  **QUALITY_LEAD** (otimiza por lead qualificado). **Refinamento sugerido:** o leads_form do playbook
  poderia usar QUALITY_LEAD para espelhar a vencedora. Resto bateu 100%.
- Modal "Nova campanha" nao concluiu via automacao headless (sem erro; provavel validacao interna de
  foto). Criacao real pelo operador (1 clique) funciona; aqui criei via SQL para validar o build.

## Para a Azenha REAL ir ao ar (PAUSED -> activate)
Criar a campanha pelo painel com **fotos + fatos reais** (preco/m²/quartos) -> gerar e **aprovar 3
criativos (3x3 copies)** -> Tráfego Pago -> **"Usar preset" (Azenha)** -> completar Destino + Privacidade
-> **Criar rascunho na Meta (pausado)** -> revisar -> **ativar com confirm** (gasta verba).

Ver [[Atualizacao_2026-06-19_Trafego_Auto_Seed_Preset]] e [[meta-ads-publicacao]].
