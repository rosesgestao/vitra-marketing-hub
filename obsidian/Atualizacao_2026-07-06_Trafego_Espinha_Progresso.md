# UX — Tráfego Pago (/#/imobiliaria-trafego): espinha de progresso + limpeza + ordem por passos — 2026-07-06

Análise profunda da página de Tráfego Pago sob lente `ui-ux-pro-max` (identidade Vitra como autoridade).
Escopo escolhido pelo Leonardo: **espinha de progresso + limpeza** (baixo risco), sem tocar em Meta,
criação ou dados.

## Diagnóstico central
A página **não é o formulário de criação** — é um **console de operação**. Criar campanha = modal "Nova
campanha" (wizard). A página: seleciona campanha → gera/aprova criativos → revisa e publica no Meta. O
problema não era falta de fluxo, e sim **falta de espinha de orientação + ruído + ordem invertida**.

## Nova ordem (por passos)
1. **Passo 1 · Campanha** (seletor; era "Campanha de mídia ativa").
2. **Espinha de progresso** (novo `CampaignProgressSpine`): 4 fases (Campanha, Criativos, Aprovação,
   Publicação) de dado real da campanha selecionada — "onde estou / o que falta". Ícone+texto (não só cor),
   `aria-current`, rola no mobile.
3. **Sobre a automação** (era "Esteira de automação" — jargão): recolhível (`<details>` fechado), contexto
   secundário. A espinha assume a orientação.
4. **Passo 2 · Criativos e anúncios** (era "Tráfego Pago · Meta Ads"): StatTiles + **cards de anúncio**.
5. **Passo 3 (opcional) · Presets** (recolhível; saiu o "clonar a vencedora" do título).
6. **Passo 4 · Revisar e publicar** (final; build PAUSED + confirm).

## Correções
- **Faixa de dev removida** do header (projectRef/URL/"Supabase configurado") — ruído; mantido só o
  **alerta** quando falta a chave pública (misconfig real).
- **Ordem de leitura corrigida**: os cards de anúncio vinham DEPOIS de "Revisar e publicar" → movidos para
  ANTES (criativos → presets → publicar).
- Presets e "Sobre a automação" viraram `<details>` recolhidos (progressive disclosure) — não competem com
  a ação principal.

## Arquivos
`dashboard/src/views/PremiumDashboard.jsx` (espinha, reordenação, renomeações, remoção da faixa) +
`dashboard/src/components/PublishMetaPanel.jsx` (kicker "Passo 4"). Sem backend/edges.

## Preservado
Build Meta PAUSED + ativar só com confirm, regras de criação, dados/templates/criativos, identidade Vitra.

## Verificação
lint + 278 testes + build (verdes). Tela atrás do login → Leonardo validou visualmente. Commit `ebb7d1d`.

## Próxima fase possível (não feita)
Fase B: mover Presets para dentro do modal de criação + transformar a operação num acordeão guiado de fato.

[[Atualizacao_2026-07-06_Fix_Exclusao_Campanhas]]
