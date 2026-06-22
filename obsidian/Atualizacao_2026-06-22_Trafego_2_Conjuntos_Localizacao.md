# Atualizacao 2026-06-22 — Tráfego: 2 conjuntos por localização (PoA + raio do imóvel)

> Regra do gestor: toda campanha sobe com 2 conjuntos — **Porto Alegre** (cidade inteira) + **Região do
> imóvel** (raio ≤ 2 km do endereço geocodificado). Na `main`. Commit: **<HASH>**.

## Diagnóstico
A estrutura de 2 conjuntos já existia no `build_draft` (raio `custom_locations` + cidade `cities`), mas o
lat/lng só vinha de uma campanha de referência importada ("clonar a vencedora"). Numa campanha **nova** não
havia captura de endereço nem geocodificação → o conjunto regional ficava sem coordenadas e degradava p/
cidade/país. Faltava a ponte **endereço → lat/lng** como padrão do fluxo.

## Entregue
### Geocodificação (decisão: Nominatim/OSM + ajuste manual)
- **Nova Edge `geocode-address`** (Nominatim, server-side, sem chave; gate das demais). Enviesa p/ Porto
  Alegre/RS/Brasil; devolve `{found, lat, lng, label}` ou not-found acionável. `config.toml` + deploy CLI.
- **premiumData:** `geocodeAddress(address)`, `META_POA_CITY_KEY='264859'`, `REGIONAL_RADIUS_MAX_KM=2`,
  `buildGeoAdSets({lat,lng,radiusKm})` (monta os 2 conjuntos canônicos; sem lat/lng → só PoA),
  `saveCampaignGeo()` (persiste `brief.geo_target` p/ reuso).

### UI — `PublishMetaPanel` ("Revisar e publicar")
- Bloco **"Localização · 2 conjuntos de anúncios"**: endereço (pré-preenchido do brief) + **Localizar** →
  geocodifica; **lat/lng editáveis** (override manual); **slider de raio 1–2 km** (teto 2); link **"ver no
  mapa"**; botão **"Definir os 2 conjuntos"** → seta a proposta canônica e persiste o geo no brief.
- **Prevenção de duplicado/incorreto:** "Definir" gera **exatamente 2** conjuntos com nomes padronizados
  (**"Porto Alegre"** / **"Região do imóvel (raio X km)"**), substituindo qualquer proposta anterior; raio
  clampado ≤ 2 km. "Sugerir públicos por IA" virou **opcional**.
- **Endereço incompleto/não encontrado:** mensagem clara + entrada manual de lat/lng + aviso âmbar ("sem
  coordenadas → só Porto Alegre").
- **Pré-visualização antes de publicar:** os 2 conjuntos aparecem na lista (geo + coords + faixa etária).
- **Integração Meta:** `build_draft` já cria raio (`custom_locations`, clamp ≥1km) + cidade (`cities[key]`).

## Verificação (ao vivo)
- deno check + lint + **162 testes** + build OK; deploy CLI.
- Edge: "Av. Dr. Carlos Barbosa, 531, Azenha" → **-30.0608, -51.2115** (bate com o build Azenha validado).
- UI (Murano): "Localizar" geocodificou Rua Coronel Claudino → -30.0949/-51.2438; "Definir os 2 conjuntos"
  → prévia com **Região do imóvel (raio 2 km)** + **Porto Alegre (cidade inteira)** (screenshots conferidos).

Ver [[Atualizacao_2026-06-19_Fix_Interesse_Depreciado_Meta]] e [[meta-ads-publicacao]].
