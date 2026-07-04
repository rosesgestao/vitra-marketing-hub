# Onda 3 — PublishMetaPanel: "Avançado" colapsado + CTA por estado do funil — 2026-07-04

Continuação da Onda 3 (fluxos) no Tráfego Pago, logo após o wizard de Nova Campanha (validado no ar).

## Feito
1. **"Opções avançadas" colapsadas** (P1: o painel mostrava 6 blocos de config de uma vez). Direcionamento
   detalhado + Plataformas/posicionamentos + Públicos da Meta viraram um `<details>` **colapsado por
   padrão** — 80% dos casos só precisa de conta/página/orçamento/destino (que seguem visíveis, junto da
   Localização e do `missingToBuild`). O estado dos avançados PERSISTE colapsado (React state), então o
   build usa os presets das campanhas de referência normalmente. `<summary>` acessível (seta gira com
   `group-open`, marker nativo escondido).
2. **CTA por ESTADO do funil**: os 3 botões da barra (Gerar cortes · Aprovar todos · Exportar pacote)
   competiam com peso visual parecido. Agora só o botão do **passo atual** fica dourado sólido (primário);
   os outros ficam secundários. Estado: render pendente → Gerar · gerado → Aprovar · tudo pronto →
   Exportar. Um CTA primário por vez.

## Verificação
build 1558 módulos + 240 testes + lint. Mudanças de UI contidas (details + className condicional por
estado). Fluxo/visual = validação do Leonardo no ar (o painel só é alcançável logado).

## Restante da Onda 3 / próximos
Conteúdo orgânico (window.prompt → modal in-app + "salvar as 3"); refino window.confirm→confirm-in-app;
Métricas com gráfico. Depois Onda 4 (split do PremiumDashboard, adReadiness único).
[[Atualizacao_2026-07-04_Onda3_Wizard_NovaCampanha]] [[deploy-hostinger-vitrapremium]]
