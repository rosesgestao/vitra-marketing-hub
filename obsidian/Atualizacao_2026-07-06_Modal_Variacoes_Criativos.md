# UX — Modal "Nova campanha": fusão em "Variações dos criativos" — 2026-07-06

Análise das seções "Variação controlada pelo template" + "Quantidade de criativos" / "Quantas variações por
template" sob lente `ui-ux-pro-max`. Duas seções descreviam **o mesmo controle** e se **duplicavam**.

## Correção de premissa
O modal é **single-template** (Catálogo é seleção única). Então não existe "N templates selecionados"; a
conta real é **1 template × N versões × 3 formatos = N×3 imagens**. O total já era calculado — faltava
linguagem simples.

## O que mudou (fusão em uma seção só)
- **Removida a duplicação**: o bloco "Variação controlada pelo template" + o helper repetido viraram uma
  frase + o detalhe **"ver o que muda"** recolhível (`<details>` com chips *pode variar* / *permanece fixo*).
- **Renomeado**: seção → **"Variações dos criativos"** (fim de "Quantidade de criativos" × "Quantas variações
  por template" competindo). Campo → **"Quantas versões?"**.
- **Controle**: dropdown com jargão → **opções rápidas** (chips 3/5/8/10/12) como **radiogroup acessível**
  (role=radio, aria-checked, setas + roving tabindex, focus-visible).
- **Total automático e claro**: caixa em destaque *"5 versões × 3 formatos (feed, story, wide) = 15 imagens"*
  (`aria-live`), com linha de contexto do template/moldura selecionados e dica de tempo.
- **Jargão**: "cortes/anúncios" → "versões/imagens"; alinhado também no resumo do passo 3.
- **Alerta de capacidade** (overflow via `distinctConceptCapacity`) mantido.

## Preservado
Valores `creative_variations` (3/5/8/10/12), `distinctConceptCapacity`, lógica de criação/geração, templates,
dados, integração e publicação. Só o front (passo 1). Meta segue PAUSED+confirm (fora do modal).

## Verificação
lint + 278 testes + build (verdes); preview reiniciado sem erro de console. Modal atrás do login → Leonardo
validou. Arquivo: `dashboard/src/components/NewCampaignModal.jsx`. Commit `db70352`.

[[Atualizacao_2026-07-06_Modal_Nova_Campanha_Refino]]
