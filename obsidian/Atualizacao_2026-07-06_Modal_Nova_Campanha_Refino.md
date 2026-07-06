# UX — Modal "Nova campanha": refino guiado + IA no passo 2 + cards de moldura — 2026-07-06

Três melhorias no modal `NewCampaignModal.jsx` (wizard de 3 passos), sob lente `ui-ux-pro-max`, sem tocar
em regras de criação, validação, IA, templates, dados ou integração.

## 1. Refino guiado (`bbb8e5f`)
- **Revisão real no passo 3** (antes de "Criar Campanha"): resumo do que será criado (template, variações/
  cortes, produto, preço, copy aplicada?, imagens n/n obrigatórias, objetivo = Leads definido na publicação)
  + pendências em âmbar. Lê do `form`. Fim do passo "Imagens & revisão" que não tinha revisão.
- **Passo 1 reordenado**: "Variações do criativo" (controle técnico) saiu do topo e desceu para **abaixo do
  catálogo** → o Catálogo de Templates volta a ser a decisão-herói. Rótulos clareados ("Quantidade de
  criativos" / "Quantas variações por template").
- **Descarte ao fechar**: `window.confirm` → `ConfirmModal` (acessível, foco-preso, consistente).

## 2. Importar de um anúncio · IA → topo do passo 2 (`150777c`)
Pergunta do Leonardo, com razão: a seção tem como payoff principal **preencher os campos de dados** (passo
2). Pelo princípio de proximidade (ferramenta perto do efeito), moveu-se para o **topo do passo 2**, acima
dos campos que ela preenche; declutteriza o passo 1 (fica Template + Quantidade). "Sugerir template" segue
funcionando a partir do passo 2 (só atualiza a seleção). Movido pela técnica de reposicionar a fronteira
dos passos (sem reproduzir as ~197 linhas do bloco).

## 3. Sem/Com moldura → cards com mini-preview (`7ba1bb5`)
Toggle só-texto → **cards de seleção com miniatura por variante** (referência `-sem-moldura`/`-com-moldura`,
com o contorno embutido) + rótulo + texto de apoio ("Visual limpo, sem contorno" / "Contorno dourado de
destaque"). Rótulo "Moldura do criativo" + explicador. Seleção sem depender só de cor (borda+check+selo).
Acessível: `role=radiogroup/radio`, `aria-checked`, setas + roving tabindex, `focus-visible`. Só aparece
quando o template tem >1 variante; valor gravado segue `form.creative_template_variant`.

## Preservado
Separação criar (modal) × publicar Meta (PAUSED+confirm); regras/validação/IA/templates/dados/integração;
identidade Vitra. Objetivo/público/período/orçamento seguem no passo "Revisar e publicar" (não no modal).

## Verificação
lint + 278 testes + build (verdes) em cada etapa; preview reiniciado sem erro de console. Modal atrás do
login → Leonardo validou. Arquivo: `dashboard/src/components/NewCampaignModal.jsx` (+ `PublishMetaPanel.jsx`
no kicker, na etapa anterior). Commits `bbb8e5f` + `150777c` + `7ba1bb5`.

[[Atualizacao_2026-07-06_Remove_4_Templates_Nao_Aprovados]]
