# Propagação v2 — hero-panel-gallery (2026-07-01)

3ª família (depois de [[Atualizacao_2026-07-01_Propagacao_v2_DuoSelos|duo-selos]]). Arquétipo **SPLIT**:
foto hero + painel navy com conteúdo **left-anchored** (headline Anton + destaque dourado/bairro +
bullets com seta + "OPORTUNIDADE POR:" + preço) + galeria lateral.

## Diagnóstico: já estava saudável
O render não tinha bug visível — o fix anterior do `heroChecklistBullets` (split `|`, feito no
hero-checklist) já fazia os 5 bullets dividirem certo aqui também. Prova do efeito-rede da propagação:
consertar um helper limpou várias famílias. Então a migração foi **declarar o que faltava** no gate.

## v2 declarado
- **logo** (`requireLogo`), **eixo** (headline/destaque/label/preço no mesmo x → `axis_spread=0`; bullets
  indentados pela seta ficam fora do eixo), **destaque** e **bullets** com char-limit.
- **gapCap só no cluster de topo** (headline→destaque→bullets). O par **label+preço é bottom-anchored no
  painel** (como o CTA do hero-checklist) → fora da cadeia de gap. Caixa do destaque apertada p/ não dar
  overlap falso com os bullets.
- render-version hero-panel v1→v2. Sem helper compartilhado tocado.

## Verificação
Harness **3 formatos verdes** (axis=0); 202 testes + ESLint OK. Cortes removidos.

## Placar
oferta-ancora ✅ · hero-checklist ✅ · duo-selos ✅ · **hero-panel ✅**. Restam: lancamento (próxima),
vitrine, oportunidade-bairro, ficha-imovel, destino-bairro. Padrão de arquétipo já mapeado: **cluster de
topo + par label/preço (ou CTA) bottom-anchored** aparece em hero-checklist e hero-panel — o gapCap
respeita isso tirando o elemento ancorado da cadeia.

Commit: hero-panel v2 (logo + eixo + cluster). [[render-asset-deploy-e-limites]]
