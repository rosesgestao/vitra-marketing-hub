# Atualização 2026-06-26 — Copiloto: handoff inteligente + deep-link (Incremento 4)

Fecha a lacuna vista em uso real (print do operador): quando o copiloto **não consegue montar o rascunho
dentro do painel** (imóvel não cadastrado, ou cadastrado mas sem mídia configurada), ele agora **leva o
contexto ditado para o Tráfego Pago** — em vez de cair num handoff genérico sem nada preenchido. E no
caso de **sucesso**, o "Revisar e ativar" abre o painel **com a campanha já selecionada**.

## Mecanismo — `lib/copilotIntent.js` (novo)
Canal leve em memória do módulo entre o Copiloto e o PremiumDashboard (a tela de Tráfego):
- `setTrafegoIntent(intent)` grava a intenção **e dispara um evento** (`vitra:trafego-intent`).
- `peekTrafegoIntent()` lê sem limpar; `clearTrafegoIntent()` limpa.
- Dois tipos: `{ type:'select', campaignId }` e `{ type:'create', prefill:{name,product_name,neighborhood,price} }`.

Por que peek + evento: o App remonta a view ao navegar (`key={view}`), então o painel lê via **peek no
mount**; mas se o painel **já estava montado** (navegar p/ a view atual é no-op), o **evento** aplica a
intenção mesmo assim. O peek (não consome) sobrevive ao **double-mount do React.StrictMode** em dev;
o clear é adiado (1,5s).

## Copilot.jsx — branch `trafego`
- Sucesso (rascunho PAUSED criado): resultado guarda `campaignId`; o botão "Revisar e ativar" grava
  `{type:'select', campaignId}` antes de navegar → painel abre com a campanha selecionada.
- Imóvel cadastrado SEM mídia: `{type:'select', campaignId}` (operador faz a 1ª config já na campanha).
- Imóvel NÃO cadastrado: `{type:'create', prefill}` com o que foi ditado (nome/bairro/preço, via mergeArgs)
  → abre "Nova campanha" preenchida.

## PremiumDashboard.jsx — consumo da intenção (só modo trafego)
- `selectedCampaignId` inicial faz **peek** do intent 'select'.
- Efeito aplica no **mount E via evento** (`apply()` idempotente): 'create' → `setCreatePrefill` + abre o
  modal; 'select' → `setSelectedCampaignId`. Clear adiado; listener removido no cleanup.
- `openCampaignModal` (abertura MANUAL) zera o prefill — só o copiloto preenche.
- `NewCampaignModal` recebe `prefill` (capturado UMA vez via `prefillRef` estável: entra no init do form
  e no reset por `brandProfile.scope`, sem re-aplicar a cada render nem sobrescrever edições).

## Verificação (ao vivo, preview)
- Comando "Crie uma campanha para o **The Garden Residence** no bairro Petrópolis, R$ 20/dia, leads"
  (imóvel não cadastrado) → "Confirmar e abrir" → navegou para **imobiliária-trafego** e abriu **"Nova
  campanha" com "Nome do Produto" = The Garden Residence** (confirmado no DOM + screenshot). Modal
  cancelado (sem criar registro). Console limpo; lint+build OK.
- Pipeline de intenção (copiloto → navega → painel consome no mount/evento, à prova de StrictMode)
  PROVADO pelo caminho 'create'. O 'select' usa o MESMO pipeline (troca `setModalOpen` por
  `setSelectedCampaignId`); o build PAUSED em si foi validado no Inc. 3 — não repeti o build real da
  Murano para não criar/apagar outra campanha na conta.

## Próximos passos
- Estender o `trafego` para montar o rascunho de imóveis SEM config prévia direto no copiloto (coletar
  Página/objetivo/destino com proteção de marca/ToS) — hoje encaminha ao painel preenchido.
- Transcrição server-side (Whisper) + memória de longo prazo + deep-link da aba "Revisar e publicar".

Commit: front (copilotIntent + Copilot handoff inteligente + PremiumDashboard consumo/prefill).
