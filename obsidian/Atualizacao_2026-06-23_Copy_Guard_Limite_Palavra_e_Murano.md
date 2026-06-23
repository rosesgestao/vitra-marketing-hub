# Atualizacao 2026-06-23 — Guard de copy por limite de palavra + Murano finalizado

> Corrige falso-positivo do guard de marca e completa a copy do Murano. Na `main`. Commit: **d0076b5**.

## Bug corrigido (copyValidation)
O guard de vocabulário de marca casava por **substring cru** (`haystack.includes(w)`) — "curado" (léxico
Premium) era detectado dentro de **"pro-curad-os"**, reprovando copy legítima da Imobiliária (visto ao vivo
ao gerar o ângulo de preço do Murano). Fix: passa a casar por **limite de palavra** via regex
`(?<!\p{L})termo(?!\p{L})` (flag `iu`) — `\p{L}` trata letras acentuadas (á, ç, ã) como letra, então o termo
só casa quando não estiver colado a outra letra. Frases multi-palavra ("alto padrão") seguem casando.
- +2 testes de regressão: "procurados" NÃO casa "curado"; "curado," (palavra real) AINDA é sinalizado.
- 164 testes no total (antes 162). Redeploy `generate-copy` + `publish-meta-ads` (ambos importam o guard).

## Murano finalizado (remediação do estado de teste)
As iterações de hoje (P0/P1/render) deixaram a campanha real do Murano inconsistente. Como PO, fechei o loop:
- Os 2 conceitos que ainda tinham copy fraca de template e **descrição vazia** ("Destaque de localização" e
  "Lista de atributos") ganharam **copy completa e enriquecida** via vitra-copy (ângulos limpos: localização
  e atributos/planta) — `texto_principal` + `descrição` gravados nos **3 cortes** de cada conceito.
- Atualizei **só os campos de anúncio** (texto/descrição), não a headline nem a arte: esses campos não são
  impressos no template hero-panel, então **não houve re-render** e as artes aprovadas/renderizadas ficaram
  intactas.
- "Oportunidade por" mantida em `generated` (aguardando aprovação humana da arte); os outros 2 seguem
  `approved`. `meta_campaign_id` = null / status `planning` (limpo após os delete_draft de teste).
- Resultado: 3 conceitos × 3 formatos renderizados, **todos com copy completa** — pronto para o operador
  aprovar e o build PAUSED. Nada ativado.

Ver [[Atualizacao_2026-06-23_Copy_Descricao_Obrigatoria_P0]] e [[Atualizacao_2026-06-23_Render_9x16_Endurecido]].
