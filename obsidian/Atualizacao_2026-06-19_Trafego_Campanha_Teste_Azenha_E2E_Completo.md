# Atualizacao 2026-06-19 — Campanha de TESTE Azenha: E2E completo PAUSED + achados

> Rodado o fluxo ponta a ponta do Tráfego Pago para a Azenha com criativos de teste; campanha **mantida
> PAUSED** (nao apagada). O teste pegou um erro real (QUALITY_LEAD) e validou o caminho confiavel.

## Resultado (tudo PAUSED, zero gasto)
- **DB campanha:** `[TESTE] Residencial Azenha 531` (id `fe266337-237c-4216-b4d1-92812e3f2ff2`), status
  planning, **3 criativos aprovados** (copies distintas, imagens Imob reaproveitadas), 2 publicacoes paid.
- **Meta campanha:** `120252931593820221` (OUTCOME_LEADS, AUCTION, LOWEST_COST_WITHOUT_CAP, **CBO R$15/dia**, PAUSED).
- **Conjuntos (2):** Regional `120252931594770221` — geo **radius_point 2km em -30.0608422/-51.2115284**;
  Cidade `120252931601720221` — geo **city 264859 (POA)**. Ambos LEAD_GENERATION, age 25-65, FB+IG.
- **Anuncios (2):** `120252931598030221` (regional) + `120252931604000221` (cidade).
- **Lead form:** `2198436384324809` (pt-BR, FULL_NAME/EMAIL/PHONE, is_optimized_for_quality=false = mais volume/sem SMS).
- Verificado via `read_campaign_config` — confere 100%.

## Erro encontrado e corrigido (o motivo de testar PAUSED)
1ª tentativa com **`QUALITY_LEAD`** (ajuste anterior) → a Meta rejeitou o conjunto: *"Selecione um objeto
promovido para seu conjunto de anuncios"*. **QUALITY_LEAD = otimizacao de "leads de conversao"** e exige
`promoted_object` com **integracao de CRM/conversoes offline** — nao e swap livre do LEAD_GENERATION.
**Correcao:** revertido o playbook para **`LEAD_GENERATION`** (promoted_object {page_id} + form ON_AD,
confiavel); QUALITY_LEAD fica como melhoria **condicionada ao CRM** (comentado no playbook). Commit f69fd50.
Re-build apos a reversao: **sucesso**.

## Ajustes necessarios p/ o fluxo 100% (achados)
1. **Multi-criativo por conjunto:** o `build_draft` cria **1 anuncio por conjunto** (usa `anyFeed`/`feedOf`),
   compartilhando 1 criativo. Os 3 criativos aprovados existem no banco, mas o build usa 1 — **o "3 criativos
   x 3 copies" do preset NAO e exercido**. Enhancement: criar N anuncios por conjunto (rotacao de criativo).
2. **QUALITY_LEAD** so apos conectar CRM/conversoes (acima).
3. **Forms orfaos:** cada build cria um leadgen form novo (nome com timestamp) — acumulam na Pagina.
   Idempotencia por `meta_lead_form_id` existe, mas builds de teste geram novos. Limpeza periodica.
4. **Criativos/destino placeholder:** imagens Imob reaproveitadas + destino/privacidade de teste — trocar
   por **fotos reais + dados do empreendimento** para produção.
5. **build_draft nao e transacional:** se falhar no meio, pode deixar orfaos PAUSED (caso do QUALITY_LEAD —
   conferir/limpar com delete_draft se necessario).

## Estado
Campanha de teste **viva e PAUSED** na conta PoA (sem veiculacao/cobranca). Para ir ao ar: trocar
criativos/destino por reais, revisar no painel e **ativar com confirm**. Ver
[[Atualizacao_2026-06-19_Skill_Vitra_Trafego_e_QualityLead]] e [[meta-ads-publicacao]].
