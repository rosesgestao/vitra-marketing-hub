# Onda 3 (passo 1) — validação com foco/scroll no 1º erro (NewCampaignModal) — 2026-07-04

Início da Onda 3 (fluxos) pelo NewCampaignModal. Entrega o **P0 de validação** do modal de Nova Campanha
de forma SEGURA (lógica, sem tocar no shell) — e explica por que o resto do wizard precisa de teste ao vivo.

## Feito (P0 — "validação só no submit sem foco no 1º erro")
Antes: ao submeter incompleto, o modal só mostrava uma STRING no rodapé com a lista de campos; o operador
tinha que **caçar** os campos no scroll longo. Agora:
- `renderTemplateField`: cada campo ganha `id` (= formKey), `aria-invalid` e **borda vermelha** quando
  faltante (destaque inline).
- `submit()`: em falha, marca `missingKeys` (Set) e faz **scroll + foco no 1º campo faltante** (template
  ou `product_name`). Editar um campo destacado limpa o destaque na hora.
Ganho direto: o operador cai no lugar certo e vê exatamente o que falta, sem varrer o formulário.

## Deferido para um passo com TESTE AO VIVO (razão de engenharia)
- **Migração do NewCampaignModal para `<Modal>`**: o `<Modal>` fecha por **Esc e clique no scrim** — que
  o overlay cru NÃO fazia. Sem um confirm-in-app de "descartar campanha?", isso vira **perda acidental** da
  campanha (incluindo a copy gerada por IA). Fazer isso + o confirm exige ver o fluxo.
- **Step-split (wizard de 3 passos)**: esconder/mostrar seções com Next/Back num render de ~700 linhas com
  interdependências (scroll do copiloto, aiCopy) é a mudança que mais precisa de olhos no fluxo. Casa com
  o **split do arquivo (Onda 4)**. Não faço às cegas na tela mais crítica do produto.

## Verificação
build 1558 módulos + 240 testes + lint; preview recarrega limpo, React monta. Vai ao ar no rebuild.
[[Atualizacao_2026-07-04_Onda2_Modais_A11y]] [[deploy-hostinger-vitrapremium]]
