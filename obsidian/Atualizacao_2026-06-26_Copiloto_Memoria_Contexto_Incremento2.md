# Atualização 2026-06-26 — Copiloto: memória, contexto e auditoria (Incremento 2)

Segundo incremento do Copiloto da Operação. Dá ao copiloto **memória** (conversa multi-turno),
**contexto** (enriquece automaticamente com o que a plataforma já sabe do imóvel) e **rastreabilidade**
(cada turno gravado). É a fundação para a execução ponta-a-ponta dos próximos incrementos.

## O que entrou

### Banco — tabelas `agent_*` (migration aplicada)
- `supabase/migration-agent-copilot-memory.sql` (aplicada via MCP `apply_migration`):
  - `agent_conversations` — thread do copiloto, por marca.
  - `agent_messages` — turnos (user/assistant) → memória curta multi-turno.
  - `agent_runs` — **auditoria**: comando → plano → status/resultado (rastreabilidade).
- RLS habilitada com políticas permissivas anon/authenticated, **espelhando `premium_campaigns`**
  (insert with_check true; select/update using true) — mesma postura de ferramenta interna.

### Frontend — `premiumData.js`
- `createAgentConversation` / `appendAgentMessage` / `saveAgentRun` — memória + auditoria, **best-effort**
  (se o insert falhar, o copiloto segue funcionando; memória é um plus, não um bloqueio).
- `resolveImovelContext(name, brandScope)` — **enriquecimento**: resolve o imóvel citado contra
  `premium_campaigns` (ilike em product_name/name, marca ativa) e devolve os fatos consolidados (colunas
  + `brief.product_data`: price, neighborhood, area, suites, differentials, objetivo, campaign_id).

### Frontend — `Copilot.jsx`
- **Multi-turno:** mantém `history` (estado) e passa os últimos 6 turnos ao orquestrador → follow-ups
  funcionam ("agora crie a campanha **desse imóvel**" resolve o imóvel do turno anterior). Thread visível
  no painel (bolhas user/assistant). Botão "Nova conversa" zera a memória.
- **Enriquecimento:** após o plano, resolve o imóvel citado e mostra o badge verde "🗄 Usei os dados de
  <imóvel> já cadastrado (preço · bairro) — não precisa repetir". Na execução, `mergeArgs` usa o falado
  como prioridade e o banco preenche as lacunas (menos perguntas).
- **Auditoria:** cada turno grava conversa + mensagem + run (`planned`/`executed`/`handoff`/`error`).

## Verificação (ao vivo, preview + banco)
- Turno 1 "Gere copies para o **Murano**" → plano COPYWRITING + badge "Usei os dados de Murano já
  cadastrado (**R$ 719.900,00**)" — enriquecido de `premium_campaigns`.
- Turno 2 "agora crie uma campanha de tráfego **desse imóvel** com R$ 50/dia, objetivo leads" → SEM
  repetir "Murano", o orquestrador resolveu para **Murano** pelo histórico → plano TRÁFEGO PAGO + ⚠
  exige confirmação + prévia PAUSADA. Thread mostrou a conversa inteira.
- Banco: `agent_conversations`=1, `agent_messages`=4 (2 user + 2 assistant), `agent_runs`=2
  (copy/baixo/planned + trafego/alto/planned). Console limpo; lint+build OK.

## Próximos passos (não implementado)
- Execução end-to-end do **trafego** dentro do painel (criar/parear `premium_campaigns` + `build_draft`
  PAUSED a partir do plano, reusando `buildMetaDraft`) — hoje ainda faz handoff para a tela Tráfego Pago,
  que já carrega o `campaign_id` resolvido na auditoria.
- Deep-link do handoff abrindo a campanha resolvida já selecionada.
- Transcrição server-side (Whisper) + memória de longo prazo (fatos consolidados por imóvel/campanha).

Commits: migration (SQL no repo) + front (helpers `agent_*`/enriquecimento + Copilot multi-turno).
