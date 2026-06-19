# Atualizacao 2026-06-19 — Tráfego: campanha de referência por DROPDOWN (sem digitar ID)

> O campo "ID da campanha de referência" passa a seguir o mesmo padrão de auto-descoberta da Conta/Página:
> lista as campanhas da conta selecionada num dropdown. Na `main`. Commit: **9650341**.

## Análise (PO + dev)
O input manual de ID era fonte de erro (copiar/colar) e fricção. A Conta e a Página já são auto-descobertas
(`list_ad_accounts`/`list_pages`). Faltava o mesmo para a campanha de referência — agora resolvido.

## Entregue
- **Edge `manage-audiences` → `list_campaigns`** (read-only): `GET act_/campaigns` com
  `id,name,objective,effective_status,created_time,start_time,stop_time` (limit 200). Deploy OK.
- **Helper** `listMetaCampaigns(adAccountId)` (premiumData), no padrão de `listMetaPages`.
- **`MetaPresetsPanel`:** seletor de **Conta de anúncio** (auto-descoberto, pré-seleciona a da marca) +
  **dropdown de Campanha** (rótulo = **nome · status · período**) + **filtro Todas/Ativas/Pausadas**.
  Recarrega a lista ao **trocar a conta**; mostra **"Nenhuma campanha"** quando vazio; **fallback** para
  input manual de ID se a conta não listar (sem token/permissão). Datas epoch-0 ignoradas no período.

## Como o fluxo funciona (respondendo ao pedido)
- **Busca:** `list_campaigns` por conta (Graph, read-only). **Vínculo:** usa a conta selecionada no painel.
- **Exibição:** nome + status (Ativa/Pausada/Arquivada…) + período (desde/intervalo).
- **Filtros:** Todas/Ativas/Pausadas. **Seleção:** dropdown define o `metaCampaignId` do "Importar config".
- **Permissões/acesso:** as edges usam o `META_ACCESS_TOKEN` (system user); contas sem acesso simplesmente
  não aparecem em `list_ad_accounts`, e a lista de campanhas cai no fallback manual se a conta não responder.
- **Sem campanhas:** estado vazio explícito. **Troca de conta:** efeito recarrega as campanhas e zera a seleção.

## Verificacao (ao vivo)
lint, 157 testes, build OK; console limpo. No preview: input manual sumiu; Conta + Campanha por dropdown;
o dropdown listou **200 campanhas reais** (ex.: "TOM MENINO DEUS 30.05 · Ativa · desde 05/12/25"); filtros
presentes; selecionar a 30.05 → "Importar config" → blueprint OK.

Reduz erro de digitação e torna o fluxo mais simples/seguro. Ver
[[Atualizacao_2026-06-18_Trafego_Painel_Presets_e_Azenha]] e [[meta-ads-publicacao]].
