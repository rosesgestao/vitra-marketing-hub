# Atualizacao 2026-06-17 — Conteúdo Fase A: IA editorial + playbook de pilares/tipos

> Base do canal ORGANICO (sala editorial da Vitra). Conteudo-first, no padrao do Tráfego Pago. Na
> `main`. Commit: **66fc380**.

## Entregue
- **`_shared/contentPlaybook.ts`** (fonte unica Deno+Vite, padrao do `objectivePlaybook`):
  - **Pilares**: autoridade, educativo, bastidores, prova_social, imovel, oportunidade, captacao,
    localizacao (cada um com etapa de funil + descricao).
  - **Tipos**: institucional, imovel, bastidores, educativo, autoridade, oportunidade, prova_social,
    captacao, parcerias_b2b (construtoras/incorporadoras), lifestyle_bairro — cada tipo deriva
    pilar+formato+funil+hint para a IA.
  - **Formatos**: feed, carrossel, reels, stories, legenda (com `hasScript`).
  - **Tons** + helpers (`contentTypeSpec`/`contentFormatSpec`) + options para a UI. NEUTRO de marca.
- **Edge `generate-content`** (Claude, modo ORGANICO): a partir de tipo+pilar+formato+briefing leve,
  gera N ideias com **ideia / headline / legenda pronta / CTA / hashtags / roteiro (reels-stories) /
  direcao visual**, na VOZ da marca (Imobiliaria x Premium) e com `copyValidation` (separacao de marca,
  issues). Gate (`x-copilot-gate`) + `ANTHROPIC_API_KEY` server-side. `config.toml` verify_jwt=false.
- **premiumData**: `generateContentWithAI({brandScope,contentType,pillar,format,tone,count,context})` +
  re-export do playbook editorial para a UI.
- **Teste** de sanidade do playbook (155 testes no total).

## Verificacao (ao vivo)
deno check, lint, 155 testes, build OK; edge deployada. Probe: sem gate -> `forbidden_gate`. Geracao
real (Imobiliaria, educativo/carrossel) devolveu posts on-brand (legenda + hashtags + direcao visual em
navy+dourado) e a validacao sinalizou headline >80 chars — ou seja, IA propoe, validacao guarda, humano
revisa.

## Diferenca do generate-copy
`generate-copy` = ANUNCIO (headline/body/cta). `generate-content` = POST organico (ideia/legenda/roteiro/
hashtags/visual). Mundos separados, mesma disciplina de marca.

## Proximas fases (do plano aprovado)
- **Fase B**: UI "Novo conteúdo" conteudo-first (tipo+pilar, fonte opcional, briefing leve) gravando em
  `premium_content_posts` (campaign_id opcional) com status/lifecycle.
- **Fase C**: Calendário + publicacao manual (marcar publicado + link).
- **Fase D**: metricas organicas (corte na Métricas transversal) + Biblioteca/Config.

Ver [[meta-ads-publicacao]] (padrao do copiloto) e a analise da aba Produção.
