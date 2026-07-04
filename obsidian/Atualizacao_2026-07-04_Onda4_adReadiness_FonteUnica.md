# Onda 4 (início) — adReadiness único: fonte única de prontidão de publicação — 2026-07-04

Primeiro passo estrutural da Onda 4. Ataca o **maior risco funcional latente** do Tráfego Pago: o QA do
card e o gate de publicação computavam prontidão em **dois lugares diferentes, mantidos à mão** — e já
divergiram uma vez (o bug da descrição: o card dizia "pronto", o "Criar rascunho" travava por falta de
`descricao`, porque só o gate a checava).

## O problema (duplicação)
- `evaluateMetaAdReadiness(ad)` (QA do card) tinha a linha `texts`/`description` com os campos exigidos.
- `publishableAssets` (gate do "Criar rascunho") **repetia** os mesmos campos num filtro separado.
- Duas checklists paralelas → toda mudança de regra tinha que ser espelhada nos dois. Quando não era,
  divergiam (foi o bug da descrição).

## A correção (fonte única, sem mudar comportamento)
Extraí 3 predicados puros no topo do módulo, e os dois consumidores passam por eles:
- `metaCopyChecks(asset)` → `{ texts, description }` (textos Meta granulares, p/ o QA mostrar QUAL falta).
- `assetRenderedApproved(asset)` → status aprovado/publicado + `public_url` + não pende render aprovado.
- `assetPublishReady(asset)` = `assetRenderedApproved` + textos + descrição = **contrato real do
  build_draft**.
- `publishableAssets` = `ads.flatMap(assets).filter(assetPublishReady).length`.
- `evaluateMetaAdReadiness` usa `metaCopyChecks(first)` nas linhas `texts`/`description`.

**Álgebra idêntica** (verificado): `Boolean(a && b && c)` ≡ `Boolean(a) && Boolean(b) && Boolean(c)`; o
filtro do gate = os mesmos 7 termos de antes. Os campos exigidos para publicar agora vivem num lugar só —
não podem mais divergir do QA. O QA-polish (3 cortes + foto + UTM + lint + destino) segue mais estrito que
o gate, como deve ser.

## Verificação
build 1558 módulos + 240 testes + lint — refatoração pura, sem mudança de comportamento observável (mesmos
números no card e no gate). **Push SEGURO na fila do OK do Leonardo** (tela crítica; combinado de não dar
push aqui sem OK explícito, mesmo em mudança que eu considere segura).

## Restante da Onda 4
Split do PremiumDashboard.jsx (5.6k linhas); Métricas com `<table>` + gráfico; unificar Produção de Conteúdo
(Kanban+Calendário); drawer→`<Drawer>`; migrar `text-[Npx]`→tokens; selects nativos→`<Select>`.
[[Atualizacao_2026-07-04_Onda3_Conteudo_Publish_SalvarTodas]] [[deploy-hostinger-vitrapremium]]
