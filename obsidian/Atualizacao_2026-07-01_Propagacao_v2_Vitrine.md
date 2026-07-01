# Propagação v2 — vitrine-gallery (2026-07-01)

4ª família. **Reordenei a propagação** para focar as SELECIONÁVEIS (as que o operador escolhe no "Nova
Campanha") — o catálogo tem 13 templates mas só 6 são selecionáveis; o hero-panel que fiz antes é oculto.
Selecionáveis: oferta-ancora, hero-checklist, duo-selos (feitas) + **vitrine, ficha-imovel, destino-bairro**.

Arquétipo do vitrine: **SPLIT diagonal** (painel navy à esquerda com conteúdo left-anchored: wordmark,
headline, De/Por, bullets, CTA; galeria de fotos à direita).

## BUG real (colisão)
Headline de **3 linhas** ("CASA EM / CONDOMÍNIO / FECHADO") empurrava a última linha sobre o bloco De/Por
(Y fixo, pensado p/ 2 linhas) → "FECHADO" **colidia** com "De R$ 990.000,00". Fix estrutural:
**deslocamento ADAPTATIVO** — quando a headline é mais alta que o previsto, De/Por + bullets + CTA descem
juntos; com 2 linhas o shift é 0 (layout original preservado). **Clamp** do shift p/ o CTA nunca sair da
safe-zone (story é denso: 3 linhas + 5 bullets + De/Por + CTA).

## v2 declarado
- logo (requireLogo), **eixo** (headline/De-Por no mesmo x → axis=0), **preço como BLOCK** (o gate passa a
  pegar a colisão headline×preço), bullets, gapCap no cluster de topo (CTA bottom-anchored fora da cadeia).
- vitrine v1→v2. **Previews regenerados** (você pediu por família): 5/6 (story com-moldura = 546/OOM 9:16).

## Verificação
Harness **3 formatos verdes** (axis=0; o story reprovou `safe_zone:cta` antes do clamp — gate pegando o
overflow real). 202 testes + ESLint OK. Cortes removidos.

## Placar (selecionáveis em foco)
oferta-ancora ✅ · hero-checklist ✅ · duo-selos ✅ · **vitrine ✅** · hero-panel ✅ (oculto). Restam
selecionáveis: **ficha-imovel** (próxima), destino-bairro. Depois, ocultos: lancamento, oportunidade-bairro.

Commit: vitrine v2 (shift adaptativo + eixo) + previews. [[render-asset-deploy-e-limites]]
