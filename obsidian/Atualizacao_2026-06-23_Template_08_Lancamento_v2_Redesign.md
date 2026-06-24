# Atualizacao 2026-06-23 — Template 08 "Lançamento" REDESENHADO (v2, densidade San Clemente)

> A v1 saiu genérica; refeita com conceito estratégico próprio no nível dos aprovados. Na `main`. Commit: **2ff588a**.

## Diagnóstico (por que a v1 ficou inferior)
A v1 era foto full-bleed + véu + selo + headline + 1 linha de localização + CTA. **Faltava a densidade
estratégica** dos aprovados (San Clemente/duo-selos): sem painel institucional, sem diferenciais, sem âncora
de preço, sem destaque dourado, hierarquia rasa → leitura de "post de banco de imagens", não de peça Vitra.

## Redesign (v2) — conceito próprio + densidade
Reescrito o `buildVitraLancamentoSvg` para a estrutura editorial densa, distinta do San Clemente pela
**finalidade de lançamento/escassez**:
- Foto hero no topo + **painel navy institucional** (família azul→navy do brandbook) embaixo.
- **Selo de lançamento** dourado (pill) + wordmark branco.
- **Headline** (Anton) + **destaque dourado** (bairro/região).
- **Lista de diferenciais com setas douradas** (até 3) — explora o que torna o lançamento desejável.
- **"A PARTIR DE" + preço** (Anton dourado) — âncora de conversão (ou "Pré-venda exclusiva" sem preço).
- **CTA pill "Entrar na lista VIP"** — escassez/exclusividade.
- Campos novos no catálogo: `differentials` (lista) + `price` (a partir de), além de selo/headline/destaque/cta.
- Copy das recipes reescrita (lançamento, pré-venda exclusiva, condições, endereço, lista VIP).
- `renderVersion` bump → `lancamento-approved-v2` (re-render dos PNGs em storage).

## Comparação final (v2 vs. aprovados)
| Critério | v1 (genérica) | v2 (refeita) | San Clemente |
|---|---|---|---|
| Painel institucional | ❌ | ✅ navy | ✅ |
| Diferenciais | ❌ | ✅ 3 setas | ✅ |
| Âncora de preço | ❌ | ✅ "a partir de" | ✅ |
| Destaque dourado | ❌ | ✅ | ✅ |
| Conversão (CTA) | fraca | ✅ Lista VIP | (sem CTA) |
| Hierarquia | 4 níveis | **6 níveis** | 6 níveis |
→ v2 **equivalente/superior** em especificidade, estratégia e densidade, com finalidade publicitária própria.

## Verificação (ao vivo)
deno check + lint + **164 testes** + build; deploy CLI. 3 formatos renderizados (1:1, 9:16, 1.91:1) e
conferidos por imagem — selo, headline, destaque, 3 setas, "A partir de R$ 590.000,00", CTA Lista VIP; safe
zone de reels OK no 9:16. 6 previews (sem+com moldura) regerados. Bug do seed (\\n literal nos diferenciais)
corrigido com quebras reais; no app o textarea já gera quebras corretas. Assets temporários removidos.

Ver [[Atualizacao_2026-06-23_Template_08_Lancamento]] e [[Atualizacao_2026-06-12_Template_07_Hero_Panel_San_Clemente]].
