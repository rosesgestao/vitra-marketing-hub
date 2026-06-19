# Atualizacao 2026-06-19 — Fix: botão "Criar rascunho na Meta" travado sem explicação

> O botão ficava desabilitado mesmo com tudo preenchido, porque o gate exigia o QA-polish completo
> (mais rígido que o build_draft). Alinhado ao contrato real + lista do que falta. Na `main`. Commit: **<HASH>**.

## Causa raiz
`canBuild` exigia `readyAds > 0`, e `readyAds = ads.filter(ad => evaluateMetaAdReadiness(ad).ok)`.
O `evaluateMetaAdReadiness.ok` só passa com **6 checks por grupo**: 3 cortes Meta + **foto de origem
(`source_image_url`)** + render + textos + **UTM por anúncio (`meta.url_params`)** + aprovação de TODOS os
cortes. Os criativos aprovados (incl. placeholders/IA) não têm `source_image_url` nem UTM por anúncio →
cada card mostrava "2 pendências" → `readyAds = 0` (stat "QA FINAL 0/3") → botão travado, **sem dizer o porquê**.

Mas o **`build_draft` (edge) é bem mais leniente**: publica qualquer asset **APROVADO + renderizado
(`public_url`)** com textos; conta/página/destino/orçamento vêm do painel. O gate estava **mais rígido que
a publicação real**.

## Correção (`PublishMetaPanel`)
- Novo gate alinhado ao contrato do edge: **`publishableAssets`** = assets `approved/published` + `public_url`
  + (não precisa re-render de template aprovado) + título + (texto_principal|copy) + CTA. `canBuild` passa a
  exigir `publishableAssets ≥ 1` + conta + página + destino + orçamento (≥R$1) + pixel (se Vendas).
- **Mensagem clara do que falta** (`missingToBuild`): bloco âmbar acima do botão listando exatamente os
  itens pendentes (conta/Página/destino/orçamento/pixel/criativo aprovado) + `title` no botão. Fim do
  "desabilitado sem explicação".
- Mensagem de prontidão usa `publishableAssets` (com nota "itens de QA opcionais ainda pendentes" quando o
  QA-polish completo não fechou). Stats de QA (3 cortes/foto/UTM) seguem como **advisory**, não bloqueiam.

Observação: o gate não revalida vocabulário — se a copy reprovar no `copyValidation` (canal paid), o build
devolve `skipped_creatives` com o motivo (já exibido), em vez de travar o botão silenciosamente.

## Verificação
- lint limpo · **162 testes** ✓ · build OK · preview sem erros no console.
- Só front-end (sem deploy de edge). Commit <HASH>.

Ver [[Atualizacao_2026-06-19_Correcoes_P0_Trafego_Copywriter]] (skipped_creatives) e
[[Atualizacao_2026-06-19_Porta_InApp_Vitra_Copy]].
