# Atualizacao 2026-06-18 — Tráfego: campanha de referência → preset (Fase 1: importador)

> Padrao reutilizavel "clonar a campanha vencedora". Fase 1 = ler/normalizar a config real de uma
> campanha de referencia (READ-ONLY na Meta). Na `main`. Commit: **d2efbac**.

## Contexto (gestor de trafego)
Analisadas 2 campanhas TOM MENINO DEUS (conta Vitra Porto Alegre 122035585232240):
- **30.05** (ref. validada): R$2.539 -> **179 leads, CPL R$14,19**, madura.
- **10.06**: R$133 -> 8 leads, CPL R$16,71, CTR 4,76% (nova, em aprendizado — nao virar baseline).

## Entregue (Fase 1)
Acao **`read_campaign_config`** na edge `publish-meta-ads` (read-only; usa `meta_campaign_id`): le via Graph
campanha + conjuntos + (tentativa de) leadgen form e devolve um BLUEPRINT normalizado. Helper `summarizeGeo`
classifica o geo (city / radius_city / radius_point lat-lng / region / country).

## BLUEPRINT REAL extraido da 30.05 (verificado ao vivo)
- Campanha: `OUTCOME_LEADS`, AUCTION, lance `LOWEST_COST_WITHOUT_CAP` (Highest volume), **CBO R$15/dia**.
- Ambos os conjuntos: optimization **`QUALITY_LEAD`**, billing IMPRESSIONS, posicionamentos **facebook+instagram**, generos **todos**.
- Conjunto **REGIONAL MD**: geo **raio de ponto** 1 **milha** (~1,6km) em lat/lng **-30.048346, -51.22509**, age **25–65**.
- Conjunto **amplo "TOM 3 SUÍTES"**: **cidade** Porto Alegre (key `264859`), age **18–65**.
- Lead form: NAO localizado nesta leitura (refinar lookup — pode estar em asset_feed_spec/outro path).

## Padrao a fixar (decisoes de gestor)
- Faixa etaria: a ref. diverge (25–65 vs 18–65); PADRONIZAR em **25–65** (ticket alto).
- Raio regional: ref. usa ~1,6km; PADRAO sera **2 km** (pedido do Leonardo, melhora a ref.).
- FB+IG fixo + generos todos = confirmados.
- Form SMS por ticket: alto = "mais volume" (sem SMS); menor = "maior intencao" (com SMS) =
  `is_optimized_for_quality` no form.

## Proximas fases (faseado, escolha "Tudo")
- **Fase 2:** tabela `premium_meta_presets` + helpers (read/save/list) + UI "Importar campanha de referencia -> salvar preset".
- **Fase 3:** `build_draft` com geo RAIO (lat/lng + km) no conjunto regional + cidade no macro; aplicar preset; toggle SMS/form por ticket. (Caminho credenciado -> PAUSED/confirm.)

Ver [[meta-ads-publicacao]] e [[conteudo-organico]].
