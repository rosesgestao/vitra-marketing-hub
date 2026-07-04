# Onda 3 (fecho) — Conteúdo orgânico: publicar por modal in-app + "salvar as 3" — 2026-07-04

Último passo da Onda 3 (fluxos). Mata o diálogo nativo do fluxo orgânico e o risco de perder rascunhos de IA.

## Feito
1. **Publicar → modal in-app** (antes `window.prompt` nativo: sem identidade, sem validação, sem cancelar
   limpo). `publish(post)` abre um `<Modal size="sm">` com `<Input>` do link (opcional) + Cancelar/Marcar
   como publicado; `confirmPublish` roda a ação real. Reusa o design system (Modal + Input).
2. **"Salvar todas (N)"** — botão no cabeçalho das sugestões de IA que persiste todos os rascunhos ainda
   não salvos num clique (`handleSaveAll` itera os pendentes). Antes só dava para salvar card a card, e as
   sugestões não salvas somem ao gerar novas — risco de perder trabalho.

## Fora de escopo (deliberado)
O `window.confirm` de **"Ativar (gastar) na Meta"** fica intocado — é o guarda de gasto, documentado e
proposital. Os demais `window.confirm` (excluir campanha/preset e o confirm-close do wizard) podem virar um
`<ConfirmModal>` reutilizável num passo dedicado (refino).

## Verificação
build 1558 módulos + 240 testes + lint. Fluxo = validação do Leonardo no ar (alcançável logado).

## Estado da Onda 3 = COMPLETA
validação-foco ✅ · wizard Nova Campanha ✅ (validado no ar) · PublishPanel Avançado+CTA ✅ · Conteúdo
publicar+salvar-todas ✅. Próximo: refino window.confirm→ConfirmModal, e/ou Onda 4 (split do PremiumDashboard,
adReadiness único, Métricas com gráfico). [[Atualizacao_2026-07-04_Onda3_PublishPanel_Avancado_CTA]]
[[deploy-hostinger-vitrapremium]]
