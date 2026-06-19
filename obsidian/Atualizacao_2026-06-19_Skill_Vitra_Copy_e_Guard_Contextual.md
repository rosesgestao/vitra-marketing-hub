# Atualizacao 2026-06-19 — Skill `vitra-copy` (v1) + guard de copy contexto-aware (pago)

> Copywriter de anuncios pagos como skill propria, ancorada nos padroes reais das campanhas vencedoras;
> e o guard `copyValidation` agora libera, **so no pago da Imobiliaria**, os termos genericos de mercado
> que mais converteram — sem deixar a voz editorial Premium vazar. Na `main`. Commit: **08c7446**.

## Contexto (analises que motivaram)
Como copywriter senior, analisei as copies reais das campanhas ATIVAS da conta PoA `122035585232240`
(janela 12–19/jun): TOM 3 SUÍTES (R$1.099.900), Casa 381m² (R$1.250.000), Lançamento Bourbon Wallig
(a partir R$379.900). Padrao recorrente: **headline = preço-âncora** (unicode bold + 🏷), gancho com emoji,
**ancoragem de valor** ("X% abaixo do mercado"/"menor m² da região"), **specs em bullets**, **localização
por proximidade**, **escassez/raridade**, condições comerciais nos tickets de entrada, CTA por objetivo
(visita × cadastro), copy média-longa. A copy vencedora era a MESMA em vários criativos (criativo dinâmico
permuta título/imagem) — **uma estrutura forte testada em vários criativos** > muitas copies fracas.

**Tensão descoberta:** os anúncios que mais converteram na Imobiliária usam *"alto padrão", "exclusiva"* —
léxico que o `copyValidation` bloqueava na Imob. Decisão de produto **(a)**: liberar esses **genéricos de
mercado** no canal **pago** da Imobiliária, mantendo bloqueado o léxico **genuinamente Premium**.

## Entregue
### 1) Guard contexto-aware (`_shared/copyValidation.ts`)
- Léxico Premium dividido em **`PREMIUM_STRICT`** (curadoria, atemporal, sofisticado, seleto, singular,
  discreto, patrimonial, "uma categoria acima", liquidez, "experiência de morar"… — **sempre** bloqueado na
  Imob) e **`MARKET_GENERIC`** (alto padrão, exclusivo/exclusiva/exclusividade).
- `bannedVocabForScope(scope, channel='organic'|'paid')` e `validateCopyAngle(..., { channel })`: no **pago**
  da Imobiliária, libera `MARKET_GENERIC`; no **orgânico** (default) a separação segue **dura**. Premium
  inalterado (sempre bloqueia promo barata).
- **Wiring:** `generate-copy` (geração de anúncio) e `publish-meta-ads/build_draft` (gate de publicação)
  passam `channel:"paid"`. `generate-content` (orgânico) fica estrito. Prompt do `generate-copy` ajustado:
  a IA agora sabe que pode usar genéricos de mercado no pago (mantendo proibido o editorial Premium).

### 2) Skill `vitra-copy` (v1) — `.claude/skills/vitra-copy/` (gitignored)
- `SKILL.md`: copywriter de anúncios pagos. Entradas (imóvel+público+objetivo+faixa+referência) → saídas
  (headline/texto principal/descrição/CTA por ≥3 ângulos) em markdown + **JSON importável** (shape do
  asset/`meta_ad`). Fronteira dura: só propõe, PAUSED+confirm, separação de marca, não inventar, não copiar
  verbatim. Irmã de `vitra-trafego` (estrutura) e `vitra-conteudo` (orgânico); alimenta a Edge `generate-copy`.
- `references/copy-playbook.md`: os padrões extraídos (estrutura, 4 ângulos, recorrências, por marca/faixa,
  CTA por objetivo, limites técnicos, variações, critérios anti-genérico). Autoridade de marca = `copyValidation`.

## Verificacao
- `deno check` generate-copy + publish-meta-ads OK.
- Dashboard: lint limpo, **160 testes** ✓ (12 no copyValidation, incl. 4 novos do canal pago), build OK.
- Casos novos provam: no **pago** Imob, "alto padrao"/"exclusiva" NÃO sinalizam; "curadoria" AINDA sinaliza;
  `bannedVocabForScope(scope,'paid')` exclui genéricos mas mantém Premium.
- **Deploy:** `generate-copy` deployado via MCP (**v10**, ACTIVE). Geração já destravada no servidor.

## Pendência (1 passo operacional)
- **Redeploy `publish-meta-ads` via Supabase CLI** (`supabase functions deploy publish-meta-ads`): a mudança
  de 1 linha no gate (`channel:"paid"`) está commitada no disco, mas a edge ativa ainda roda a versão estrita.
  Não remontei o bundle de 468 linhas à mão (risco de quebrar a publicação; convenção do projeto = CLI lê do
  disco). Até o redeploy, o gate de publicação pode pular criativos com "alto padrão"/"exclusivo" no pago.

## Estado
Camada de copy paga agora tem: **skill (craft) + playbook (padrões reais) + edge (geração) + guard
contexto-aware**, com aprovação humana e PAUSED. v2 da `vitra-copy`: aprender com CPL/CTR por anúncio
(`premium_metrics`) — quando houver campanha ativa. Ver [[Atualizacao_2026-06-19_Trafego_Build_Multi_Criativo_3x3]].
