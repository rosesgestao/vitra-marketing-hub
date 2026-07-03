# Copiloto: extração de "diferenciais" agora compõe de amenidades/lazer (2026-07-03)

## Sintoma
Nova campanha (template checklist-rail) → "Extrair e gerar copy" preenchia Nome/Headline/Valor mas
deixava **Checklist de diferenciais** vazio → campo obrigatório barrava "Criar campanha".

## Causa-raiz (NÃO era o template)
O pipeline funciona (product_name/headline/price/cta vinham). A IA (extract-facts) devolvia
`differentials: present=false`. Diagnóstico com o texto real (Flow MGF, cheio de amenidades: Piscina,
Coworking, Espaço Fitness, Pet Place, PUCRS, 100% Financiável): **com 1 campo** a IA extraía os itens;
**com os 6 campos** ela COMPUNHA frases ("Perto da PUCRS", "Infra de lazer") que a **ancoragem
anti-alucinação** (exige substring contígua) DERRUBAVA — todos os itens caíam → present=false. O prompt
não dizia que amenidades/lazer/conveniências são diferenciais válidos, nem que cada item tem que ser um
TRECHO LITERAL.

## Fix (só prompt, ancoragem intacta)
`_shared/factsExtraction.ts`: regra 7 nova + `valueDesc` do campo lista — para campos LISTA, retornar até
5 itens, cada um **trecho LITERAL e CONTÍGUO** do texto (nome de amenidade/ponto próximo/característica/
condição, ex.: "Piscina", "Coworking", "PUCRS", "100% Financiável"); PROIBIDO parafrasear/combinar/
adicionar conectivos. A validação item-a-item (substring) segue como backstop — afrouxar seria arriscado,
então o fix alinha a SAÍDA do modelo à regra, não a regra à saída.

## Verificação
extract-facts deployado; 3/3 runs com os 6 campos → `differentials present=true` com 5 amenidades
ancoradas, `flagged=0` (a headline também parou de cair). 240 testes (factsExtraction 24) + deno check.
Beneficia TODOS os templates com campo lista (duo-selos, hero-panel, checklist-rail). Fix já no ar (edge).

## Nota
Itens >30 chars ainda são reprovados pelo render (provenance) — o operador encurta; amenidades costumam
ser curtas. [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
