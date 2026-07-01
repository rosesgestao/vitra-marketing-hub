# Oferta-âncora: eixo único + anti-overflow + QA Harness (2026-07-01)

Continuação da [[Atualizacao_2026-07-01_Validador_Layout_Deterministico_Fase1|Fase 1 do validador]].
Novos screenshots marcados apontaram 2 problemas na v4 (a placa de preço já estava OK) + o pedido de um
**loop automatizado** que impeça erros básicos antes de exibir.

## Diagnóstico (v4) — 2 causas estruturais
1. **Eixos de texto escalonados.** Os containers alinhavam em `x`, mas o TEXTO não: headline em `x`,
   texto da barra em `x+padding`, "POR:" em `x+padSide`, DE em `x+16`. Recuos diferentes → lia como
   "desalinhado". **Decisão de direção de arte (Q1/Q3): eixo ÚNICO à esquerda** (logo centralizada no
   topo = assinatura; todo texto num só eixo; preço herói por tamanho+ouro). **Não centralizar** —
   leitura L→R + preço dominante pedem left-axis.
2. **Barra encostando o texto na borda** (1.91:1). O estimador de largura **subestima** → o hug ficou
   justo demais.

## Correções (na FONTE, render-asset)
- **Eixo único:** `axis = margin + INSET`; headline/barra/DE/POR/rodapé partem todos de `axis`; as placas
  começam em `margin` com padding-esquerdo = INSET (o texto interno cai no eixo). `ofertaBox` ganhou o
  parâmetro `inset`.
- **Anti-overflow:** `WIDTH_SAFETY = 1.06` nas larguras que abraçam (barra, chips DE/economia, placa) —
  compensa a subestimação; o texto fica com folga (`fill_bar` 1.0 → **0.94**), nunca encosta.
- **Creative Lint v2.1:** 2 regras novas — **`overflow`** (`fill > maxFill` → texto excede o container) e
  **`axis_misaligned`** (desvio dos eixos ópticos > `axisTol`; grava `axis_spread`). render-version v4→v5.

## QA Harness — o "loop" determinístico (a solução estrutural do pedido)
`dashboard/scripts/creative-qa.mjs` (`npm run qa:creative`). Renderiza uma **matriz de fixtures**
(conteúdo curto/médio/preço-grande/headline-longa × 1:1/9:16/1.91:1) pela Edge real, lê o
`metadata.lint` e **compara com o resultado ESPERADO** de cada fixture (normal→`ok`; estresse→reprovar
pela regra certa). Trata 546 (OOM 9:16) como infra (retry), não como falha de design. Sai 1 no CI se
qualquer fixture divergir → **trava regressão**. **Decisão técnica:** o núcleo do loop é DETERMINÍSTICO
(script), não julgamento do modelo; o Claude Code entra só na camada de CONSERTO quando o harness falha.

## Verificação (render real)
- 4 fixtures renderizadas. **Referência (feed/story/wide): `ok:true`**, `axis_spread=0` (eixo perfeito),
  `fill_bar=0.94` (sem overflow), `fill_price=1`, `price_ratio≈3.2`.
- **Estresse "headline-longa" (wide): `ok:false` com `char_limit:headline`** → o gate REPROVOU conteúdo
  longo em vez de truncar/exibir (exatamente o comportamento pedido no Q2).
- Inspeção visual feed+wide: todo o texto no mesmo eixo esquerdo; barra com folga à direita. **202 testes
  (4 novos: overflow/axis) + ESLint OK.** 3 previews sem-moldura → v5. Fixtures removidas.
  (com-moldura feed/wide seguem v4; story com-moldura pendente por 546/OOM 9:16 = P0.2.)

## Arquitetura recomendada (resposta ao pedido do loop)
Combinação, não loop puro de modelo: **harness determinístico (núcleo)** + **Creative Lint v2 (validação
geométrica)** + **layoutKit (componentes auto-equilibrantes)** + **schemas/tolerâncias por formato** +
skills de direção de arte só como PRÉ-FLIGHT/consertador. Próximo: golden reference (regressão visual por
pixel) e propagar às 8 famílias restantes; auto-regeneração no motor (needs_human).

Commit: eixo único + anti-overflow (v5) + creativeLint overflow/axis + QA harness.
[[render-asset-deploy-e-limites]]
