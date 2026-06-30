# Tráfego Pago — Fase 2 (criativos): oferta-ancora reestruturado (preço-protagonista) (2026-06-30)

Primeira peça da análise **criativo-a-criativo** (Dev Sênior + PO + Diretor de Design, lente
`ui-ux-pro-max`) prometida no roadmap do Tráfego ([[Atualizacao_2026-06-26_Auditoria_Trafego_Pago_Roadmap]]).
Análise por etapas do **oferta-ancora** (template de preço-âncora De/Por) nos 3 formatos (1:1 / 9:16 /
1.91:1), com fixes **estruturais no motor** (não cosméticos) — foco em **preço** e **áreas vazias**.

## Diagnóstico (ANTES — 3 formatos)
1. **Preço não saltava** (sendo o protagonista do template): `ofertaBox` era um box **navy translúcido
   34% + borda dourada + valor branco** → a foto vazava por trás e o branco competia com a headline/barra
   (também brancas). Baixo contraste e baixa percepção de valor.
2. **"DE: R$ 439.000,00"** riscado **flutuava** cinza sobre a foto, ilegível, sem plate.
3. **Desconto não aparecia**: 439→319 = **R$ 120 mil (−27%)**, o maior gancho de oportunidade, não era
   surfaçado. Faixa horizontal ao lado do "DE" ficava vazia.
4. **Story com metade inferior morta**: todo o conteúdo espremido no topo ~55%; box do preço meio vazio.

## Correções estruturais (render-asset/index.ts)
- **`ofertaBox` → placa DOURADA SÓLIDA + texto navy** (antes: box translúcido + valor branco). Dourado =
  cor de valor da marca; navy sobre dourado ≈ 6:1 (AA). O preço vira o elemento mais saturado da peça →
  o olho vai direto nele. Filete navy interno (1px) dá acabamento de placa premium.
- **Linha "DE / economia"** no `buildVitraOfertaAncoraSvg`: "DE" riscado num **chip escuro legível** (à
  esquerda) + **selo "ECONOMIZE R$ 120 MIL"** (pílula navy + borda dourada, à direita) **calculado de
  De−Por** (`moneyToNumber` parseia "439.000,00" → 439000). O selo amplifica a oferta **e** preenche a
  faixa que ficava vazia ao lado do "DE".
- **Story: cluster de preço empurrado para o terço inferior** (deY 812→1086, box 868→1140, footer
  1140→1420) → some a metade morta; composição de dois focos (headline no topo, foto-herói no meio,
  preço embaixo) com o rodapé fechando junto à safe zone.

Tudo incorporado ao **template + motor** (vale para qualquer campanha que use o oferta-ancora), não ao
asset específico. Render-version **oferta-ancora-approved-v2 → v3** (cache-bust força re-render dos
assets existentes; espelhado em renderVersions.ts + creativeTemplateCatalog.js, guard test verde).

## Verificação (render real, antes×depois)
- deno check + deploy via **Supabase CLI** (lê do disco — [[render-asset-deploy-e-limites]]).
- 3 cortes de teste (price De/Por) renderizados **DEPOIS** → todos **200, sem 546** (9:16 isolado).
  Dims medidas: **1:1 1080×1080 · 1.91:1 1200×628 · 9:16 972×1728** (raster capado, esperado).
- **Creative Lint**: `ok=true`, **zero erros** nos 3 formatos (gate de aprovação passa).
- Inspeção visual antes×depois (os 3): preço agora salta como placa dourada; "DE" legível no chip; selo
  de economia presente; story sem metade morta. **182 testes + ESLint limpos.**
- Previews do catálogo (6 arquivos: 3 formatos × com/sem moldura) **regenerados** com a nova arte
  (sem-moldura = caminho `frame:none`; com-moldura = `frame:gold`). Assets de teste **removidos** do banco.

## Critérios de aceite (atendidos)
Preço visível de imediato ✅ · maior destaque que os demais textos ✅ · contraste suficiente (AA) ✅ ·
oportunidade/valor transmitidos (placa + selo de economia) ✅ · sem competir com headline/barra ✅ ·
áreas vazias com função (selo + cluster reposicionado) ✅ · adaptação aos 3 formatos validada ✅ ·
lint verde ✅. **Recomendação: aprovado.**

## Próximos criativos (mesma sequência de 9 etapas, um a um)
destino-bairro, hero-checklist, duo-selos, hero-panel, ficha-imovel — diagnóstico estrutural +
fix no template/motor + antes×depois + 3 formatos + lint, peça por peça.

Commit: render-asset — oferta-ancora preço-protagonista (placa dourada + selo de economia + story
redistribuído; v3). [[render-asset-deploy-e-limites]]
