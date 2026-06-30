# Tráfego Pago — Fase 1 (P0): quick wins de gate e falhas visíveis (2026-06-26)

Primeiros itens da Fase 1 do roadmap do Tráfego ([[Atualizacao_2026-06-26_Auditoria_Trafego_Pago_Roadmap]]):
os **quick wins front-only de menor risco** (sem tocar o motor de render ainda). Lente da skill
`ui-ux-pro-max` (disabled-state clarity, error-recovery, no silent failure).

## Entregue (PremiumDashboard.jsx — surfaces do Tráfego)
- **P0.5 — gate ÚNICO de export.** "Exportar pacote" agora só libera quando **TODOS os anúncios passam no
  QA** (`evaluateMetaAdReadiness().qaReady`: renderizados + lint ok + textos + destino). Antes exigia só
  `ads.length>0` (dava para exportar criativo não-validado). Tooltip explica o motivo quando bloqueado.
- **P0.3 — acabar com falhas silenciosas (as 2 mais críticas):**
  - Render: quando há cortes "com erro", a mensagem agora **nomeia o motivo** (`errorMessage(result.error)`)
    e o **caminho de recuperação** ("os cortes com erro seguem marcados — clique em Gerar cortes de novo").
    Antes era só "N com erro" sem causa.
  - Geolocalização: o `saveCampaignGeo(...).catch(() => {})` **silencioso** virou um aviso (`setGeoMsg` warn):
    "não consegui salvar a geolocalização — vale só nesta sessão". Antes o operador não sabia que falhou.

## Verificação
- lint limpo · **182 testes** · build OK. `errorMessage` (módulo-scope) e `setGeoMsg` (em escopo) confirmados.
- Preview (#/imobiliaria-trafego): a tela renderiza sem erro; o botão de export usa o novo gate + título
  (caso pronto → habilitado com "Baixa o JSON…"; o ramo bloqueado é o mesmo ternário). As mensagens de
  render/geo só disparam em falha real (compilam e estão em escopo).

## Estado da Fase 1
Quick wins (P0.3 parcial + P0.5) ✅. Faltam na Fase 1: **P0.1 (Premium ≥1080)** e **P0.2 (9:16 sem 546)** —
trabalho de MOTOR no `render-asset` (deploy CLI + render real + lint + retry-546, padrão
[[render-asset-deploy-e-limites]]); **P0.4 (progresso em operações longas)**; e o restante do P0.3
(auto-render notices, extract). Próximo: atacar o motor (P0.1/P0.2) com o loop de verificação real.

Commit: PremiumDashboard (gate de export + falhas visíveis de render/geo).
