# Atualização 2026-06-26 — Creative Lint: persistência + gate de aprovação (P0.5)

Fecha o ciclo "valida ANTES de aprovar": o resultado do Creative Lint (P0) agora é **persistido** no
asset e **bloqueia a aprovação/publicação** de cortes reprovados, com o motivo à vista no QA.

## Back-end (Edge render-asset)
- O builder do `destino-bairro` expõe o relatório do lint via um parâmetro `out`; o dispatch
  (`buildVitraImobiliariaApprovedSvg`) repassa o `out`; o loop de render grava `metadata.lint`
  (`{ ok, errors, warnings }`) no update do asset, junto do `public_url`/status. Sem ripple nos outros
  builders (param opcional). Templates sem lint não gravam nada (compatível).

## Front-end (PremiumDashboard / Tráfego Pago)
- `evaluateMetaAdReadiness` ganhou o check **"Validação visual (lint)"**: um anúncio com qualquer corte
  `metadata.lint.ok === false` deixa de estar "pronto" (não publica) e o check aparece reprovado na lista
  de QA. Cortes sem lint (ausente) passam.
- `handleApproveAsset` e `handleApproveGroup` **bloqueiam a aprovação** quando o lint reprovou, com
  mensagem acionável listando os erros (ex.: "overflow:hero, char_limit:hero — ajuste e re-renderize").

## Verificação (ponta-a-ponta, dados reais)
deno check + lint + build OK; deploy do Edge via CLI. Dois cortes 1:1 de teste:
- bairro "Menino Deus" → `metadata.lint.ok = true`, errors `[]`.
- bairro "Loteamento Residencial Jardim das Acácias" (43 chars > limite 18) → `metadata.lint.ok = false`,
  errors `["overflow:hero","char_limit:hero"]`.
O Edge gravou o lint corretamente nos dois; o front (readiness + handlers de aprovação) consome esse dado.
Assets de teste removidos.

## Próximo (P1)
- Imagem dirigida (smart-crop por foco + grade navy) e migrar os outros templates para o DS — assim o
  lint passa a cobrir todos os criativos, não só o `destino-bairro`.
- (P2) skill "Direção de Arte Vitra" + painel de QA dedicado mostrando os erros de lint por corte.

Commit: Edge (persiste metadata.lint) + front (check de readiness + gate de aprovação).
