# Atualizacao 2026-06-22 — Direcionamento detalhado (referências) + presets + base backend

> Análise do Direcionamento detalhado das campanhas de referência + 3 presets de interesses + base no
> build_draft (interest_ids pré-resolvidos + Advantage configurável). Na `main`. Commit: **<HASH>**.

## Configuração encontrada (lida via read_campaign_config estendido)
**30.05 (`120240689084870221`) — 2 conjuntos · QUALITY_LEAD · Advantage=1:**
- **Regional (raio) · 25–65:** Classe executiva, Resorts de luxo, Investimento, Investimento imobiliário,
  Investidor, Veículo de luxo, Bens de luxo, Portais de imóveis. (ângulo **alto padrão/investidor**)
- **Cidade (macro) · 18–65:** Casa, Reforma residencial, Investimento, Propriedade de imóveis, Bens de luxo,
  Portais de imóveis. (intenção imobiliária ampla)

**10.06 (`120252147584340221`) — 1 conjunto · LEAD_GENERATION · Advantage=1 · 25–65:**
- Casa, Apartamento, Investimento, Lar, Condomínio. (intenção imobiliária **enxuta/pura**)

## Achados
- **Só interesses** (sem comportamentos/demográficos além de idade). **Sem exclusões** detalhadas.
  **Sem público personalizado** (confirmado antes). **Advantage Audience = 1 (expansão LIGADA)** em TODOS.
- **Núcleo comum às 3:** Investimento (6003388314512) + intenção imobiliária (Casa 6002986908368, Portais 6788101567252).
- **Diferença:** 30.05 regional carrega o eixo **luxo/investidor**; 10.06 é o mais enxuto (casa/apto/condomínio).
- **Divergência do app:** o `build_draft` forçava `advantage_audience=0`; a referência usa **1**.

## Presets criados (`_shared/detailedTargetingPresets.ts`, IDs reais e globais)
1. **Intenção imobiliária (núcleo)** — origem 10.06 + macro 30.05 (recomendado padrão).
2. **Alto padrão / investidor** — origem 30.05 regional (imóvel premium/ticket alto).
3. **Casa & reforma (morar)** — origem 30.05 macro.
Cada item tem tier **core / recommended / optional** (obrigatório/recomendado/opcional) + `advantage_audience:1`.

## Base backend entregue (deploy CLI)
- `read_campaign_config`: captura `detailed_targeting` (flexible_spec: interesses/comportamentos/demográficos),
  `detailed_exclusions`, `advantage_audience`.
- `build_draft`/`targetingFor`: aceita **interest_ids pré-resolvidos** ({id,name}) — sem busca → sem item
  depreciado/indisponível — mesclados+dedup com `interest_keywords`; **`advantage_audience` por conjunto**
  (default 0; presets usam 1).

## Pendente (UI — próxima entrega)
Campo "Direcionamento detalhado" por conjunto no `PublishMetaPanel`: aplicar preset (origem visível) →
chips editáveis de interesses (add/remover; tiers) + toggle Advantage + estimativa de público; validação de
item removido pela Meta; sem duplicado/conflito. Sincroniza com a busca de interesses (Graph) da conta.

Ver [[Atualizacao_2026-06-22_Trafego_Publicos_Analise_Base]] e [[Atualizacao_2026-06-22_Trafego_2_Conjuntos_Localizacao]].
