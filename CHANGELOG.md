# Changelog — Ferramenta Operacional Vitra Premium

## Sessao 2026-06-07 — Fidelidade de marca: auditoria vs brandbooks oficiais + BRAND.md

O usuario forneceu os brandbooks oficiais (Imobiliaria e Premium) + diretorios de logos. Auditei o
projeto contra eles: **ja esta fiel** — cores (`#C4942A` dourado, `#0A1628`/`#07111F` navy, `#000`
Premium, `#F0C95C` gold-light, facetas azuis), fontes (Inter + Playfair) e logos aprovadas (todas
presentes em `public/brand/`, caminhos do brandProfiles resolvem) conferem. 3 melhorias aplicadas:

- **`BRAND.md`** (novo, raiz): codifica o Brand System no repo — paleta exata por marca, construcao de
  logo, tipografia, voz/lexico, regra de nao-mistura, e onde cada coisa vive no projeto. Fonte da
  verdade aponta para os brandbooks HTML originais.
- **Voz Premium do copiloto** (`generate-copy`): alinhada ao brandbook — "o luxo nao grita, sussurra",
  frases curtas, SEM emojis/superlativos, lexico oficial (curadoria, seleto, atemporal, discreto,
  singular...). So o ramo Premium mudou; Imobiliaria intacta (smoke-test 200, sem regressao). Deployada.
- **Separacao de vocabulario** (`_shared/copyValidation.ts`): o lexico Premium do brandbook (seleto,
  atemporal, singular, discreto, excepcional, sofisticado) agora e barrado se vazar na copy da
  Imobiliaria. +1 teste; 132 no total.

## Sessao 2026-06-07 — Copiloto de IA: revalidacao AO VIVO da copy na edicao (fonte unica)

Fecha o loop da edicao de copy: ao editar um rascunho da IA, os badges de issue passam a RECALCULAR
ao vivo (tamanho da headline, nome do produto duplicado, vocabulario fora da marca) em vez de so
limpar. Usa a MESMA validacao pura da Edge (`_shared/copyValidation.ts`) — fonte unica, sem duplicar
regra no cliente (evita drift). Frontend-only (HMR).

- **`vite.config.js`:** `server.fs.allow: ['..']` libera o dashboard a importar os modulos puros de
  `supabase/functions/_shared` em dev. Verificado: dev serve o modulo (HTTP 200) E o build bundla.
- **`premiumData.js`:** importa `validateCopyAngle` de `_shared/copyValidation.ts` e expoe
  `revalidateCopyAngle(angle, {scope, headlineMax, productName})`.
- **`PremiumDashboard.jsx`:** `editDraft` revalida o angulo editado (headlineMax vem do campo
  suggested_headline do template) e atualiza `issues` ao vivo.
- +3 testes (revalidateCopyAngle); 131 no total; build + dev verdes.

## Sessao 2026-06-07 — Copiloto de IA, degrau B: a IA sugere o template ideal (operador confirma)

A IA le o anuncio colado e RECOMENDA o template de arte que melhor encaixa, com justificativa + nivel
de confianca. O operador CONFIRMA ("Usar este template") ou mantem o atual — humano aprovador. So
Imobiliaria (onde ha 2+ templates; no Premium, com 1 template, o botao nao aparece). Gated na mesma chave.

- **Edge `suggest-template`** (espelha generate-copy): recebe o texto + os templates da marca
  (id/nome/bestFor — catalogo e fonte de verdade) e devolve `{template_id, rationale, confidence}`.
  Anti-alucinacao do id em 5 camadas: enum no schema + validateSuggestion (server) + checagem em
  suggestTemplateWithAI (cliente) + guard no handler + templateOptions.find no apply. Um id forjado
  morre em qualquer uma. config.toml verify_jwt=false; reusa ANTHROPIC_API_KEY.
- **`_shared/templateSuggestion.ts`** (puro, cross-importado): schema/prompts/validateSuggestion. +6 testes.
- **UI:** botao "💡 Sugerir o template ideal" na secao "Importar de um anuncio" + card de recomendacao
  (nome + confianca + justificativa) com "Usar este template" / "Dispensar". Aplicar troca o template
  (o useEffect de creative_template_id reseta extracao/marcas/sugestao/drafts — tudo coerente).
- **Revisao adversarial:** veredito "degrau B solido" (sem high/medium); fechado 1 low de consistencia
  (drafts de copy obsoletos limpos na troca de template). 128 testes; build + deno check verdes.

## Sessao 2026-06-07 — Copiloto de IA: fluxo unico (extrair fatos -> JA gerar a copy num passo)

Encadeia degrau B' (extracao) + degrau A (copy) num clique: o operador cola o anuncio, a IA extrai os
fatos, aplica (fill-empty) e JA gera a copy a partir do form preenchido. So Imobiliaria (a copy e MVP
Imobiliaria; no Premium o botao combinado nao aparece, so a extracao). Frontend-only, entra por HMR.

- **`handleExtractAndGenerate`** no modal: extractFactsWithAI -> buildFactsApplyPatch (fill-empty) ->
  generateCopyWithAI. Usa o `nextForm` computado LOCALMENTE (o setForm e assincrono) para a copy ver
  os fatos recem-aplicados. Guard: sem product_name no texto, para com aviso (a extracao ja entrou).
- **UI:** botao primario "✨ Extrair e gerar copy" (Imobiliaria) ao lado de "Só extrair fatos"; rotulo
  reflete a fase (Extraindo… / Gerando copy…). Ao gerar, rola ate o painel "Copiloto de copy".
- **Revisao adversarial:** 1 regressao HIGH corrigida (re-extrair granular apos um fluxo combinado
  deixava `applied` preso e escondia o botao "Aplicar") + drafts obsoletos limpos no inicio + botao
  "Gerar copy" travado durante a extracao. Encadeamento assincrono/undo/marcas IA verificados solidos.
- 122 testes; build verde.

## Sessao 2026-06-07 — Copiloto de IA, degrau B': IA extrai os fatos de um anuncio colado (ALCANCAVEL)

Segundo degrau do copiloto: o operador COLA um anuncio/briefing em texto livre e a IA preenche os
campos do imovel sozinha — tira mais um trabalho braçal, mantendo o humano como aprovador (a IA so
PROPOE; nada entra no form sem clique). Vale Imobiliaria E Premium (extracao de fatos e NEUTRA de
voz — nao gera linguagem/CTA, so transcreve). Gated na mesma chave do degrau A.

- **Edge `extract-facts`** (novo, Deno; espelha generate-copy): recebe o texto + os field specs do
  template (o dashboard e a fonte de verdade) e monta a json_schema dinamicamente; a IA devolve, por
  campo, `{value, evidence, confidence, present}`. Auth + 503 not_configured + output_config.format
  iguais ao degrau A. verify_jwt=false. Reusa o secret `ANTHROPIC_API_KEY`.
- **`_shared/factsExtraction.ts`** (novo, puro, cross-importado por Vitest): a defesa ANTI-ALUCINACAO.
  O invariante e duro — a IA NUNCA preenche dado que nao esteja no texto. `validateExtractedFacts`
  exige o PROPRIO valor ANCORADO no texto-fonte (substring contigua normalizada, com FRONTEIRA de
  palavra; numero puro com fronteira de digito). Listas sao validadas ITEM A ITEM (itens inventados
  sao removidos). Sem ancoragem -> campo descartado. Evidence e so contexto, nunca passe-livre.
- **Pipeline + UI:** `extractFactsWithAI` (chama a Edge) e `buildFactsApplyPatch` (puro: aplica so
  campos ancorados; modo `fill-empty` padrao nao sobrescreve o que o operador digitou). No modal,
  secao "Importar de um anuncio · IA" antes dos campos: paste box -> preview por campo (valor +
  badge de confianca + evidencia + issues) -> "Aplicar". Campos preenchidos ganham marca "IA ✕"
  (limpa no clique/edicao); banner com "Desfazer" em lote. Reset ao trocar template/marca.
- **Revisao adversarial** (workflow ultracode): 12 achados confirmados e CORRIGIDOS, incluindo 2 high
  que furavam o invariante (evidence validada separada do valor; recombinacao de tokens espalhados) e
  o casamento de numero curto por coincidencia. +24 testes de extracao trancam cada furo. 122 testes
  no total; build + deno check verdes.
- **Para ATIVAR:** mesma chave do degrau A (`ANTHROPIC_API_KEY`) + deploy de `extract-facts`.

## Sessao 2026-06-07 — Copiloto de IA, degrau A: pipeline + UI no modal (ALCANCAVEL)

Liga o motor de copy por IA ao fluxo real: o operador agora gera, REVISA/EDITA e aprova os angulos
direto no modal Nova Campanha, e as variacoes passam a usar essa copy como texto literal. Escopo MVP:
Vitra Imobiliaria (o Premium segue na trilha de receitas ate validacao do Brand System). Continua
gated na ATIVACAO do backend (secret + deploy da Edge); sem isso o botao devolve um erro acionavel.

- **Pipeline (`premiumData.js`):** `aiCopyConcepts(form, brand)` transforma `form.ai_copy_angles` em
  conceitos de variacao com `template_recipe` LITERAL (`source: 'ai'`, sem `{tokens}`), com cap em
  `min(N pedido, n angulos)` e base no `template.family`. `selectedMetaCreativeConcepts` passa a
  PRIORIZAR a copy de IA (IA -> receitas -> generico). `distinctConceptCapacity` reflete os angulos da
  IA quando presentes. `generateCopyWithAI(form, brand)` mapeia os fatos do imovel e chama a Edge
  `generate-copy` (chave server-side), com erro acionavel via `error.context.json()`.
- **UI (modal Nova Campanha, so Imobiliaria):** painel "Copiloto de copy · IA" apos os campos de fatos:
  botao "Gerar copy com IA", rascunhos EDITAVEIS (headline/texto/CTA) com selo de "ajuste(s) sugerido(s)"
  por angulo (issues da validacao de marca), "Usar estes angulos" (grava `form.ai_copy_angles`) e
  "Limpar". Nada vai pro ar sem o OK do humano — o operador vira aprovador, nao autor.
- +5 testes de pipeline (`aiCopyConcepts`/prioridade/capacidade); 98 testes no total; build ok.
- **Para ATIVAR de fato:** `npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` + `deploy generate-copy`.

## Sessao 2026-06-07 — Copiloto de IA, degrau A: motor de copy por IA (DORMENTE)

Primeiro degrau do copiloto de marketing imobiliario: a IA escreve N angulos de copy na VOZ DA
MARCA a partir dos FATOS do imovel; o operador vira de autor -> editor (rascunha IA, aprova humano).
Motor construido e testado; DORMENTE ate (a) definir o secret `ANTHROPIC_API_KEY` e (b) ligar o
botao no modal (proximo passo). Nada muda no fluxo atual ate ativar.

- **Edge `generate-copy`** (novo, Deno): recebe fatos + template + brand_scope + N, monta o system
  prompt da marca (Imobiliaria institucional-comercial vs Premium editorial, com o vocabulario
  PROIBIDO da auditoria), chama a Claude API (`claude-sonnet-4-6`, escolhido por custo/qualidade pt-BR)
  com **structured output** (`output_config.format`), valida no codigo e devolve `angles[]` anotados.
  Chave server-side (`ANTHROPIC_API_KEY` secret; nunca no browser). Sem chave -> 503 acionavel. verify_jwt=false.
- **`_shared/copyValidation.ts`** (novo): validacao pura (a prova do schema, que nao trava `maxLength`):
  tamanho de headline, nome do produto repetido na headline+texto, e vocabulario fora da marca
  (cross-contaminacao Premium<->Imobiliaria). Importada pela Edge E pelos testes Vitset. +8 testes (93 no total).
- Modelo/custo (referencia atual): Sonnet 4.6 ~R$0,09/campanha; Haiku 4.5 ~R$0,03 (flag `COPILOT_COPY_MODEL`).
  Custo e ruido no orcamento; a escolha foi por qualidade de voz.
- **Para ATIVAR:** `npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` + deploy + ligar o botao do modal.

## Sessao 2026-06-07 — Fase 4 (UX da Nova Campanha): preview, previsao numerica, nomes humanos

Tres melhorias de UX do modal Nova Campanha (frontend-only, entra por HMR; sem deploy).

- **Previsao numerica de pecas (sempre visivel):** abaixo de "Variacoes por template" agora mostra
  "Serao gerados N anuncios x 3 formatos = 3N cortes" para QUALQUER contagem (antes so aparecia o
  aviso quando estourava os angulos). O aviso de overflow (copy se repetiria) virou complementar.
- **Preview que reflete a variante:** novo bloco com as 3 referencias aprovadas (1:1/9:16/1.91:1) do
  template selecionado que ATUALIZA ao alternar sem-moldura/com-moldura (`referencesForTemplateVariant`).
  Antes o toggle de moldura nao mudava nada visivel.
- **Nomes de slot humanizados:** os chips de "Pode variar / Permanece fixo" do contrato de variacao
  deixaram de mostrar id tecnico cru (`safe_zone`, `format_grid`, `benefit_arrows`) e passam por um
  mapa pt-BR (`SLOT_LABELS`/`humanizeSlot`): "Margem de seguranca", "Grade de formatos", etc.
- **Validacao de todos os obrigatorios de uma vez:** o submit do modal listava UM campo faltante por
  vez (`.find`); agora junta todos (campos + slots de imagem) numa mensagem unica ("Preencha os N
  campos obrigatorios: ..."), preservando a dica de fonte externa para imagens. Menos re-submits.
- Build ok; 85 testes (sem mudanca de logica testada).

## Sessao 2026-06-07 — render-worker: prep do 9:16 full-res (DORMENTE, pronto pra ligar)

Preparacao do render-worker (Puppeteer/Chrome) para gerar o **Premium 9:16 em full-res real
(1080x1920)** — que o satori da Edge nao aguenta (OOM) — sem hospedar ainda. Tudo DORMENTE por
padrao: so entra em producao quando o worker for deployado + a flag ligada + a migration aplicada.

### Deploy-readiness + robustez (render-worker/)
- `fly.toml` (novo) a partir do Dockerfile existente: regiao gru, VM 2gb, `BATCH_SIZE=1` (Puppeteer
  full-res e pesado), healthcheck `/healthz`. Comentarios cobrem o modo always-on (poll) vs cron `once`.
- `template.js`: a foto passa pelo endpoint de transform do Storage (WebP dimensionado, decodificado
  nativamente pelo Chrome) em vez da URL crua — mais nitida no full-res, mais leve, com fallback.

### Roteamento por flag (DORMENTE — disjunto da Edge)
- `premiumData.js`: novo `isWorkerOwnedAsset` + flag `WORKER_RENDER_9X16` (env `VITE_WORKER_RENDER_9X16`,
  default **off**). Quando ligada, o Premium 9:16 ganha `metadata.render_engine='worker'` na criacao.
  `isRenderablePendingAsset` exclui o conjunto-worker do dispatch da Edge/dashboard.
- `render-worker/src/worker.js`: o `claim` passa a reivindicar SOMENTE `render_engine='worker'`
  (antes: `.neq meta_ads`); `finalizeJobs` conta o pendente de `meta_ads` (alinha com a Edge para
  campanha mista nao pendurar o job).
- `supabase/migration-render-queue-worker-route.sql` (novo, **NAO aplicado**): recria
  `claim_render_assets`/`reap_stale_render_assets`/`drain_render_queue` excluindo o conjunto-worker
  (`coalesce(metadata->>'render_engine','edge') <> 'worker'`) — Edge e worker em conjuntos disjuntos,
  sem corrida. Inclui backfill opcional. `render-asset/index.ts`: fallback legado tambem exclui o
  worker-set (null-safe, sintaxe `or` validada).
- +2 testes (85 no total). Imobiliaria 9:16 NAO usa o worker (ja e full-res na Edge).
- **Bloqueado p/ ativar (decisao do usuario):** hospedar o worker (Fly/Railway/Render) e ligar a flag.

## Sessao 2026-06-07 — Estabilidade: Premium full-res renderiza 1-por-vez (evita OOM em lote)

Descoberto ao re-renderizar os Premium antigos: renderizar VARIOS criativos Premium full-res
(satori) numa unica invocacao da Edge estoura o compute (OOM em lote) — e o cron usa `limit=4`
(clampado a 3), entao campanhas Premium novas tambem poderiam estourar. Correcao na raiz:
- `render-asset/index.ts`: probe barato do `brand_scope` do alvo (campaign_id ou asset_ids); se
  Premium (ou indefinido, conservador), o `limit` da invocacao e capado em **1** — Premium renderiza
  1-a-1. A Imobiliaria (SVG direto, leve) mantem ate 3 (sem perda de throughput). Render individual
  ja e seguro pelos scales por formato. Elimina o OOM em lote no cron/dashboard.

## Sessao 2026-06-07 — Fase 2/3 (cont.): render-version Edge (#3) + auto-fit (#4)

Dois itens da fabrica que exigiam deploy de Edge, num release so. Protegidos pelo harness do #2.

### #3 — render-version: fonte unica tambem do lado da Edge
- O literal `VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION` que estava inline no `render-asset/index.ts`
  foi movido para `supabase/functions/_shared/renderVersions.ts` (fonte unica do lado Deno). O
  dashboard ja deriva o mapa do catalogo (#1); agora o teste de guarda importa o arquivo REAL da
  Edge (`_shared/renderVersions.ts`) e falha no CI se os dois lados divergirem — sem espelho manual.
- Valores inalterados (so `financiamento-orla` versionado) -> sem re-render retroativo, sem desync.

### #4 — auto-fit da headline por LARGURA, nao por contagem de caracteres
- A headline do template aprovado encolhia por `length > headlineChars`, mas no 1.91:1 o cap de
  quebra (18) era menor que `headlineChars` (24), entao o shrink NUNCA disparava e headlines de
  glifos largos transbordavam atras das fotos. Agora usa `fitFontSize` (largura estimada por glifo
  via `estimateTextWidthPx`, piso 38px) com orcamento por formato — a MESMA logica do harness #2.
- `validateApprovedHeadline` passou a modelar o `fitFontSize` (harness reflete a arte). +3 testes (83 no total).
- So encolhe headlines que de fato estouram; headlines normais ficam no tamanho-base (sem regressao).
- Cap de quebra alinhado ao `headlineChars` do layout (1.91:1: 18 -> 24). Com o `fitFontSize` cuidando
  da largura, headlines longas deixam de truncar ("VALOR PARA AVALIA...") e cabem INTEIRAS num corpo
  menor. Verificado num dual-photo 1.91:1 real (headline de 39 chars).

## Sessao 2026-06-06 — Fase 2/3 (fechar a fabrica): ganhos sem deploy

Mapeamento multi-agente das 3 frentes para fechar a fabrica de criativos (Premium full-res,
render-version, validacao por formato) com risco + plano. Comecando pelos ganhos de baixo risco
e SEM deploy de Edge. As frentes que exigem deploy (Premium full-res, atuacao de auto-fit, fase
Edge do render-version) ficam para depois, com autorizacao.

### #1 — render-version com fonte unica no catalogo (frontend-only, sem mudanca de comportamento)
- O mapa `VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION` estava num literal solto em `premiumData.js`
  (duplicado tambem na Edge). Movido para o **catalogo canonico**: campo `renderVersion` por
  template + helper `renderVersionForFamily(family)` e mapa derivado, exportados de
  `creativeTemplateCatalog.js`. `premiumData.js` passa a importar o helper.
- **Comportamento identico**: so `financiamento-orla` tem versao (as outras 3 families seguem sem
  versao, sem disparar re-render retroativo). A Edge mantem seu espelho proprio (Deno nao importa
  modulos do dashboard) — a unificacao cross-process fica para a fase Edge (com deploy).
- Teste de guarda anti-divergencia: o mapa derivado == espelho hardcoded da Edge; +2 testes (63 no total).

### #2 — harness de overflow de texto (rede de seguranca para o render, sem deploy)
- O `render-asset` (Edge) nao tinha NENHUM teste. Extraidas as funcoes puras de texto
  (`DIMS`, `compactText`, `wrapText`, `textSizeForWidth`, `approvedTemplateLayout`) para
  `supabase/functions/_shared/textFit.ts` (sem imports Deno) e re-importadas no `index.ts` —
  comportamento identico (mesmas funcoes), confirmado por `deno check`. Vale a partir do proximo
  deploy da Edge; nada muda em producao ate la.
- Novo no modulo: estimador de largura por glifo (`estimateTextWidthPx`, tabela de avanco para
  Inter caixa-alta) + `validateApprovedHeadline(format, text)` que QUEBRA com o cap real da Edge,
  modela o encolhimento de fonte e SINALIZA ok/tight/overflow por formato (so detecta, nao muda
  pixel). Orcamentos derivados da geometria real (headline centralizada; 1.91:1 e o mais apertado).
- Testes Vitest (`textFit.test.js`, importando o modulo compartilhado da Edge): caracterizam
  wrap/compact/shrink e DEMONSTRAM o ponto cego da contagem de caracteres (18 chars largos "WWW…"
  estouram, 18 estreitos "III…" cabem). +17 testes (80 no total).
- Documenta a inconsistencia conhecida: cap de quebra do 1.91:1 = 18 vs `headlineChars` do layout = 24.

### #5 — Premium full-res por formato (deploy + secret)
- O caminho Premium (satori) renderizava a `SCALE=0.55` (~594px, abaixo do minimo Meta de 1080).
  Tornado configuravel por secret e POR FORMATO: `PREMIUM_RENDER_SCALE` (default 0.55) para 1:1 e
  1.91:1; `PREMIUM_RENDER_SCALE_TALL` (default 0.75) para o 9:16.
- **Teste em producao** (Edge re-deployada via CLI ja com o `_shared`): full-res `1.0` renderiza
  **1:1 (verificado 1080x1080)** e 1.91:1 (mais leve), mas o **9:16 (1080x1920) ESTOURA o compute
  da Edge** no satori (`WORKER_RESOURCE_LIMIT`). Por isso o 9:16 tem teto proprio (0.75 = 810x1440 =
  mesma contagem de px do 1:1 a 1.0, que renderiza ok). O caminho Imobiliaria ja e full-res (SVG direto).
- Secret `PREMIUM_RENDER_SCALE=1.0` (full-res onde cabe). Rollback instantaneo por secret, sem
  redeploy. **Follow-up:** full-res REAL do 9:16 (1080x1920) exige rotear ao render-worker (Puppeteer),
  fora do limite de compute da Edge.

Auditoria multi-agente (5 agentes, file:line) da geracao de copy dos 4 templates Imobiliaria.
Achou 4 bugs cross-cutting; aplicadas as correcoes TECNICAS (sem inventar copy de marketing nova).
As reescritas de copy + 20 angulos novos ficaram propostos para revisao do marketing.

### Correcoes aplicadas (premiumData.js + creativeTemplateCatalog.js)
- **Nome do produto vazando para a headline (HIGH):** novo token `headline_only` em `variationTokens`
  (sem fallback para o nome do produto). As 3 receitas que usavam `{headline}` cru
  (dual `oferta-direta`, patios `patios-suite`, financiamento `financiamento`) passaram a usar
  `{headline_only}`; sem headline sugerida, `buildHeadline` cai no fallback por angulo (copy
  existente) em vez de imprimir o nome cru do empreendimento. Corrige a duplicacao "Produto. Produto.".
- **Headline de financiamento com R$ descartada pela arte (HIGH):** receita `preco-partida` usava
  `Oportunidade a partir de {price}`, que a arte rejeitava (`isFinancingVisualHeadline`) caindo no
  default fixo "1DORM E 2DORM...", alem de duplicar o rotulo da price box. Trocada por
  `{headline_only}` + angle `curadoria`->`investimento` (fallback sem R$ e sem vocabulario Premium).
  Frontend-only: a Edge ja renderiza certo quando o frontend para de mandar R$ na headline.
- **maxLength desalinhado do render:** headline do dual 44->36, patios 36->30; menino-deus ganhou
  `maxLength` nos campos que a arte trunca (`suites`=32 na tarja, `condo_argument`=28). Era o unico
  template sem trava de tamanho.

### Proximos (precisam de aval do marketing — NAO aplicados)
- Reescrever copy de receitas que usam tokens de campos inexistentes (`{offer}` no dual, `{area}` no
  patios) -> hoje viram filler institucional.
- Diferenciar o angulo de escassez (hoje quase identico nos 4 templates).
- Eliminar a reabertura do body com o bairro ja usado na headline (menino `bairro-destaque`).
- Ampliar o leque com 20 angulos novos (5/template), todos brand-checados (0 mistura com a Premium).

### Validacao
- npm run test:run => 61 passed (+8 testes de regressao: headline_only, sem `{headline}` cru, sem R$
  no financiamento, maxLength alinhado); npm run build => ok. Nenhum deploy de Edge necessario.

## Sessao 2026-06-06 — Fase 2: fotos slot-aware (deployada+verificada) + HEIC

### Fotos slot-aware (render-asset) — DEPLOYADA e VERIFICADA
- `imageUrlsForApprovedTemplate`: monta a lista de fotos em ORDEM DE SLOT (fachada->0,
  living->1, varanda->2 ...) a partir de `metadata.source_images`/`brief.images`, em vez de
  prepor a foto rotacionada (`source_image_url`) na posicao 0. Novos helpers `slotOrderedUrls`/
  `urlsFromImageGroup`. Fallback para o fluxo antigo em campanhas legadas sem slots.
- financiamento-orla: usa a ordem de slot direta (localizacao->esquerda, empreendimento->direita)
  em vez de `rotateFinancingImages`, que puxava fotos aleatorias do pool (incluindo extras).
- Corrige fachada/lazer/localizacao caindo na posicao errada (e a mesma foto repetida) nos
  templates aprovados. Edge re-deployada; verificado visualmente num dual-photo real (Isla Zona
  Sul): 2 fotos distintas nos slots corretos.

### Suporte a HEIC (conversao server-side) — VERIFICADA
- Descoberto que as fotos do teste sao `.heic` (iPhone), que a Edge nao decodifica. A 1a tentativa
  (conversao no navegador via `heic2any`/WASM) FALHOU nas fotos reais de iPhone (`IMG_7509.HEIC`):
  o decodificador WASM recusava o HEVC do iPhone, gerando erro acionavel no modal.
- Solucao em duas camadas no `convertHeicIfNeeded`:
  1. Servidor: novo endpoint `/api/convert-heic` no middleware do Vite (`vite.config.js`) que
     converte os bytes crus com `heic-convert` (Node) + `optimizeJpegBuffer` (auto-rotacao/resize/
     mozjpeg) — o mesmo motor que ja convertia HEIC de pasta local. Caminho a prova de navegador.
  2. Navegador: `heic2any` (import dinamico) vira fallback para builds estaticos sem o middleware.
  Se ambas falharem, lanca erro acionavel (em vez de subir HEIC que a Edge nao decodifica).
- Verificado em producao: campanha "Teste HEIC" gerou 9/9 cortes com a foto de iPhone renderizada
  nos 3 criativos. `[HEIC] Convertido no servidor` confirmado. Requer restart do vite (middleware).

### Headline do patios: auto-ajuste de fonte (render-asset) — DEPLOYADA
- O template patios usava fonte fixa e grande; headlines transbordavam para tras das fotos.
  Agora a fonte auto-ajusta (`textSizeForWidth`, base no maior dos dois trechos) para caber na
  largura a esquerda das fotos. Verificado visualmente (1:1). `maxLength` do patios 40 -> 36.

## Sessao 2026-06-06 — Fase 2 (cont.): Aprovar todos + ampliacao de angulos

### "Aprovar todos" por campanha (P4)
- PremiumDashboard.jsx (TrafegoPagoSection): botao "Aprovar todos (N)" no cabecalho que aprova de
  uma vez todos os cortes ja gerados e prontos da campanha (reusa o `onApproveGroup` existente).
  Reduz a aprovacao peca-a-peca; gold solido, desabilitado quando nao ha cortes prontos.

### Ampliacao do leque de angulos (conteudo — financiamento-orla, draft p/ marketing)
- creativeTemplateCatalog.js: template `vitra-imobiliaria-financiamento-orla` ampliado de 5 para
  9 angulos distintos (novos: entrada-facilitada, localizacao-valoriza, pronto-pra-morar,
  simulacao). Com o cap da Fase 2, pedir 8/9 variacoes agora gera ate 9 anuncios SEM repetir copy.
  Copy em rascunho para revisao do marketing (o operador ja aprova cada criativo antes de exportar).
- Os outros 3 templates (dual-photo, patios, menino-deus) seguem com 5 angulos — ampliacao
  replicavel apos validacao da voz nesta primeira leva.
- Testes: capacidade do financiamento = 9; recipes por template >= 5. 53 testes no total.

## Sessao 2026-06-06 — Fase 2 (P1 duplicacao + P2 headline) + fix de autocomplete

Comprovado em producao no teste real: 8 variacoes com 5 receitas geravam 3 anuncios de copy
identica, e a headline longa truncava ("TESTE DE HEADLINE NO"). Correcoes:

### P1 — duplicacao de copy
- premiumData.js: `selectedTemplateVariationConcepts` capa a contagem ao numero de receitas
  distintas do template (`Math.min`), eliminando anuncios com headline/copy repetida; novo
  `distinctConceptCapacity`.
- PremiumDashboard.jsx (modal): aviso dinamico quando a contagem escolhida excede os angulos
  distintos do template ("N angulos distintos — serao gerados N anuncios sem repeticao").
- variation.test.js: baseline de duplicacao trocado por asserts de distincao; +2 testes.

### P2 — headline
- render-asset/index.ts: `wrapText` agora preenche as duas linhas e trunca a ultima com
  reticencias (em vez de cortar palavra no meio e descartar o resto) — corrige tambem casos em
  que headlines curtas perdiam palavras. Ajuda patios/dual-photo/generico.
- creativeTemplateCatalog.js: `maxLength` + helper nas headlines (financiamento 34, patios 40,
  dual-photo 44) — previne na origem a headline que nao cabe (a financiamento usa
  `financingHeadlineParts`, que rejeita headlines > 34 chars).
- PremiumDashboard.jsx: `renderTemplateField` passa a exibir o helper tambem em inputs de texto.

### Fix de UX
- Modais (Nova Campanha e edicao): `autoComplete="off"` no form e nos inputs — elimina o popup
  do navegador "Salvar documento de identidade?" que classificava a headline como dado pessoal.

### Validacao
- npm run test:run => 51 passed; npm run build => ok; deno check render-asset => ok.

## Sessao 2026-06-06 — Deploy da Fase 1 em producao

Backend da Fase 1 aplicado no projeto ativo `birxcfkyuzqnhyvetbjv`: migration claim+reaper,
secret no Vault (chave publishable), funcao do cron, Edge `render-asset` v36 (via CLI) e cron
agendado (jobid 1, a cada minuto). Verificado: Edge 200/401, pg_net 200, cron `succeeded`.
Funcoes SECURITY DEFINER travadas (`revoke ... from public`, `grant ... to service_role`).
Reconciliados os arquivos de migration (revoke/grant correto e nota da chave publishable).
Frontend retrocompativel ainda nao publicado (sem config de deploy no repo).

## Sessao 2026-06-06 — Fase 1: estabilizacao do fluxo automatico de render

Torna a geracao de cortes confiavel sem o navegador aberto: drenador unico server-side, claim
atomico, maquina de estados com retry/dead-letter e reaper de orfaos. Verificado por review
adversarial. Codigo validado localmente; passos de deploy remoto pendentes de autorizacao.

### supabase/
- migration-render-queue-claim.sql (novo): `claim_render_assets` (FOR UPDATE SKIP LOCKED, dois
  modos: drenagem `queued` e explicito por ids) e `reap_stale_render_assets` (recicla orfaos
  'rendering' com orcamento de tentativas -> 'queued' ou dead-letter 'error'). Sem ALTER TABLE
  (tentativas/timestamp em metadata).
- functions/render-asset: reaper best-effort + claim atomico (com fallback transicional);
  maquina de estados na falha (queued<3 / error dead-letter); remaining em (queued,rendering);
  cache-busting na public_url.
- migration-render-queue-cron.sql: le a chave do Vault (fim do placeholder 401), so meta_ads,
  reaper antes de drenar; schedule comentado.

### render-worker/
- src/worker.js: o claim nunca reivindica meta_ads (a Edge e canonica) — elimina a corrida e a
  divergencia de motor/marca.

### dashboard/ (React)
- src/lib/premiumData.js: predicado unico isRenderablePendingAsset/renderAttemptsFor/
  MAX_RENDER_ATTEMPTS; pendingRenderableAssetIds usa select('*')+predicado; ensureCampaignSourceImages
  preserva arte pronta e nao ressuscita dead-letters.
- src/views/PremiumDashboard.jsx: auto-render, botao manual e contadores de "Gerar cortes" usam o
  predicado unico (corrige o botao ficar desabilitado para assets em error/orfao).
- src/lib/__tests__/renderQueue.test.js (novo): 8 testes do predicado.

### Validacao
- npm run test:run => 49 passed; npm run build => ok; deno check render-asset + ingest => ok.
- Review adversarial (4 lentes): achados HIGH corrigidos (orfao/retry-infinito/job-pendurado e
  botao desabilitado).
- SQL validada por dry-run transacional (BEGIN ... ROLLBACK) no Postgres 17 do projeto ativo:
  9/9 checagens OK (claim drain e explicito, reaper requeue e dead-letter, exclusao de canal),
  sem persistir nada (confirmado 0 funcoes/0 linhas apos rollback). Branching indisponivel (exige Pro).

## Sessao 2026-06-06 — Fase 0: rede de seguranca (testes + CI)

Primeira fase do plano de consolidacao da geracao de criativos. Sem mudanca de comportamento:
trava o estado atual com testes antes de refatorar.

### dashboard/ (React)
- package.json: adicionado Vitest (devDependency) e scripts test/test:run.
- vitest.config.js (novo): config standalone (ambiente node), nao estende o vite.config para
  nao carregar o middleware de dev no runtime de teste.
- src/lib/premiumData.js: 12 funcoes puras de geracao/variacao ganharam `export` (sem alterar
  logica) para serem testadas.
- src/lib/__tests__/ (novo): 41 testes de caracterizacao (variacao, distribuicao de imagem,
  catalogo de templates, estado de render), com os bugs conhecidos congelados como baseline.

### CI
- .github/workflows/ci.yml (novo): job dashboard (npm ci + test:run + vite build) e job
  edge-functions (deno check em render-asset e ingest-source-images).

### Validacao
- npm run test:run => 41 passed; npm run build => ok (bundle identico).

## Sessao 2026-06-06 — Limpeza de honestidade da UI (sem mudanca de comportamento)

Pass de baixo risco que alinha a interface ao que esta de fato implementado. Nenhuma
alteracao de schema, fila de render, RLS ou contrato de Edge Function.

### supabase/functions/render-asset
- index.ts: removido o no que imprimia o rotulo interno do template (MODEL_LABEL) no
  canto da peca final — era texto de debug baked no PNG entregue. A constante MODEL_LABEL
  permanece (ainda usada por modelKey); o rastreio interno continua em metadata.visual_template.

### dashboard/ (React)
- src/views/PremiumDashboard.jsx: botoes "Aprovar" (AssetCard, CarouselCard, MetaAdCard)
  migrados do verde esmeralda fora de paleta (rgba(29,158,117)/#6ee7b7) para a escala gold
  do brandbook (#C4942A solido + texto #0A0A0A). Logica de estados preservada.
- src/views/PremiumDashboard.jsx: StatTile de Leads com sub "Ads Insights" (decorativo)
  trocado por "entrada manual", refletindo que as metricas hoje sao digitadas a mao.
- src/components/PremiumShell.jsx: novo componente reutilizavel RoadmapNotice.
- src/views/Agentes.jsx e Pipeline.jsx: banner RoadmapNotice deixando explicito que o squad
  de agentes / pipeline e visao de roadmap, ainda nao implementada (consultam tabelas fora
  do schema operacional Premium). Comportamento e queries inalterados.

### docs/
- escopo-oficial.md: item 6 (incompatibilidade de schema de metricas) reconciliado com o
  codigo — a incompatibilidade nao existe no repositorio; item mantido so como historico.

## Sessao 2026-06-01 — Pipeline de criativos (Fase 3) + UI de Producao

### dashboard/ (React)
- index.html: corrigida tag <link> do favicon truncada que quebrava o build.
- src/lib/premiumData.js: helpers updateAsset/approveAsset/approveAssets/requeueAsset/
  saveAssetEdit/renderCampaignAssets; CAROUSEL_LIMITS (IG 2-20, Meta Ads 2-10); phaseForBlueprint
  e gravacao de campaign_phase no metadata.
- src/views/PremiumDashboard.jsx: aba Producao virou vitrine de criativos (preview, filtros,
  badges, contadores, progresso, Aprovar/Editar, carrossel agrupado com pager+validacao,
  agrupamento por fase, trigger automatico de render ao criar campanha).

### supabase/
- functions/render-asset: Edge Function satori->resvg (post/story/carrossel, logo aprovado,
  paleta 100% brandbook) que sobe ao bucket cards e atualiza assets/jobs.
- migration-cards-storage-bucket.sql / migration-render-queue-cron.sql.

### render-worker/ (novo)
- Worker Node+Puppeteer dedicado para render full-res, consumindo a mesma fila.
