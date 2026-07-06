# UX — Tráfego Pago Fase B: acordeão guiado (1 passo por vez) — 2026-07-06

Continuação da [[Atualizacao_2026-07-06_Trafego_Espinha_Progresso]] (Fase A). Decisão do Leonardo: acordeão
de verdade. Escopo: transformar a operação num passo-a-passo colapsável.

## Constatação (corrigiu o plano)
A metade "mover Presets para o modal de criação" estava **errada**: o preset configura **publicação**
(objetivo/orçamento/geo/público via `presetBlueprintFromConfig` → `PublishMetaPanel.seed`), não criação.
Já estava corretamente acoplado ao passo Publicar. Sinalizado ao Leonardo e **mantido** onde estava.

## Implementado
Acordeão de 3 passos (só o atual aberto):
- **1 · Campanha** (seletor `bare`).
- **2 · Criativos e anúncios** (Sobre a automação + `TrafegoPagoSection` só criativos: gerar/aprovar/
  exportar + cards).
- **3 · Revisar e publicar** (`MetaPresetsPanel` opcional recolhível + `PublishMetaPanel`).

Mecânica:
- `PaidTrafficWorkspace` split em pai (early-return, sem hooks) + `PaidTrafficSteps` (hooks). `key` por
  campanha remonta → reseta passo aberto e `presetSeed` ao trocar de campanha.
- `AccordionStep` (cabeçalho número+título+status, corpo só quando aberto; `aria-expanded`,
  `focus-visible`) + `StepStatus` (chip texto+cor).
- `openStep` default = passo atual derivado de dado real (sem criativos→2; criativos ok mas não
  publicado→3).
- **Espinha clicável** (`CampaignProgressSpine.onStepClick`): Campanha→1, Criativos/Aprovação→2,
  Publicação→3. Marcador por forma (check/ponto) + texto.
- `presetSeed` elevado ao pai (liga Presets → Publicar entre passos). `TrafegoPagoSection` perdeu
  Presets/Publicar (h2 → "Gerar, aprovar e exportar"). Títulos internos sem duplicar a numeração.

## Sem regressão
A branch orgânica `activeTab==='trafego'` é **código morto** (`TABS` = assets/publicacoes/config, sem
'trafego'); o único uso vivo de `TrafegoPagoSection` é dentro do passo 2. Build Meta PAUSED + confirm,
regras/dados/templates/criativos e identidade Vitra preservados.

## Verificação
lint + 278 testes + build; preview reiniciado sem erro de console/servidor (os erros de HMR no meio eram
estados intermediários das edições). Leonardo validou. Arquivos: `PremiumDashboard.jsx` +
`PublishMetaPanel.jsx`. Commit `5e46c30`.

## Ajuste reversível anotado
Se o acordeão esconder demais no dia a dia: deixar 2 passos abertos por padrão, ou voltar à camada guiada
sem colapso.

## Follow-up (`d917414`) — 2 passos abertos por padrão
A pedido do Leonardo, o acordeão deixou de abrir 1 passo por vez. `openStep` (valor único) → `openSteps`
(Set). Default: com campanha selecionada abre **Criativos + Publicar** (2,3); sem campanha abre **Campanha
+ Criativos** (1,2). Vários podem ficar abertos; `toggle` adiciona/remove; a espinha (`onStepClick`) abre o
passo (add) sem fechar os demais. 278 testes + build + lint; preview sem erro.

[[Atualizacao_2026-07-06_Trafego_Espinha_Progresso]]
