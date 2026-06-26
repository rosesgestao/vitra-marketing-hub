# Atualização 2026-06-26 — Copiloto: tráfego end-to-end no painel (Incremento 3)

O copiloto agora **fecha o ciclo de tráfego dentro do próprio painel**: a partir de um comando em
linguagem natural, monta o **rascunho de campanha PAUSED na Meta** sem o operador sair do copiloto.
Mantém a fronteira de segurança: **PAUSED** (nada gasta), e a **ativação** continua sendo ação separada,
com confirmação no Tráfego Pago.

## Validação read-only (token + conta) — feita antes
- Ação `status` (read-only, graphGet) na campanha Murano → HTTP 200: *"Murano | Leads (formulario)"*,
  **PAUSED**, daily_budget R$ 15. Prova: **META_ACCESS_TOKEN vivo hoje** + ad account/Página funcionais.
  (O valor do token é secret server-side; o sistema só o lê na Edge, nunca no browser.)

## O que entrou
### `premiumData.js`
- `resolveCampaignMediaConfig(campaignId, brandScope)` — em vez de CHUTAR config sensível numa conta
  real, **reaproveita a config comprovada do imóvel**: Página/conta da última publicação paga
  (`premium_publications.metadata`) + objetivo da campanha + destino (listing_url do brief ou site da
  marca). Devolve `{ adAccountId, pageId, objective, destinationUrl, hasPage }`. `hasPage=false` → imóvel
  ainda sem mídia configurada (1ª vez é feita no painel, que coleta tudo: form, ToS, público).

### `Copilot.jsx` — branch `trafego` no `executar`
- Resolve o imóvel (do enriquecimento) → `resolveCampaignMediaConfig` → se houver Página comprovada e
  orçamento (do comando), chama `buildMetaDraft` (reuso 100% do helper existente) e mostra o **card de
  resultado**: "Rascunho criado na Meta — PAUSED · N conjunto(s)/anúncio(s) · R$ X/dia · nada ativado" +
  botão "Revisar e ativar no Tráfego Pago".
- Degradação graciosa: sem imóvel resolvido OU sem mídia configurada → encaminha ao Tráfego Pago (1ª
  configuração); sem orçamento → pede o valor. Erro acionável da Edge (ex.: ToS de lead) aparece no card.
- Auditoria: o run é gravado como `executed` (com built + daily_budget_cents) ou `handoff`.

## Verificação (ao vivo, end-to-end, com limpeza)
- Comando "Crie uma campanha de tráfego para o Murano com R$ 50/dia, objetivo leads" → prévia PAUSADA +
  enriquecimento → "Confirmar e abrir" → o copiloto **criou um rascunho PAUSED REAL na Meta** (1 conjunto,
  1 anúncio, R$ 50/dia) e exibiu o card de sucesso. Console limpo; lint+build OK.
- **Limpeza do teste:** o rascunho criado (meta_campaign_id 120253505025180221) foi apagado via
  `delete_draft` (deleted:true). Efeito colateral observado: o delete zerou `premium_campaigns.meta_campaign_id`
  → **restaurado** para o original (120253253931090221) via UPDATE. Confirmado por `status` read-only que a
  campanha Murano original segue idêntica ao pré-teste (PAUSED, R$ 15/dia). Nenhum lixo deixado na conta.

## Próximos passos
- Deep-link do "Revisar e ativar" abrindo já a campanha recém-criada selecionada no painel.
- Suporte ao `trafego` para imóveis SEM config prévia (coletar Página/objetivo/destino no próprio
  copiloto, com a mesma proteção de marca/ToS) — hoje encaminha ao painel.
- Transcrição server-side (Whisper) + memória de longo prazo.

Commit: front (resolveCampaignMediaConfig + Copilot build PAUSED inline).
