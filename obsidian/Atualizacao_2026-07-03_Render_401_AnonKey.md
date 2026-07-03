# Fix render "non-2xx" / cortes travados após o login (render-asset autoriza com anon key) (2026-07-03)

## Sintoma (pós-login em produção)
Tráfego Pago: banner **"Falha ao carregar a área Imobiliária — Edge Function returned a non-2xx status
code"** + cortes "aguardando corte" (não geravam).

## Causa-raiz (achada nos logs das Edges)
`render-asset` estava com **`verify_jwt=true`** (probe: sem-auth/ token inválido → 401). Antes do login o
browser mandava a **anon key** (JWT válido → passava). Depois do login, o `supabase.functions.invoke`
passou a mandar o **token de SESSÃO do usuário**; quando ele expira no meio de uma leva de cortes, a
plataforma rejeita com **401**. O retry 4× do cliente vira "non-2xx" → trava a geração + dispara o banner
(a mesma flag de erro da carga da área). Os logs mostravam render-asset alternando 200 e 401.

## Achado no caminho
O `config.toml` diz `render-asset verify_jwt=false`, mas a **CLI não aplicou** (nem `--no-verify-jwt`
funcionou; a Edge permanece true — provável deploy antigo via outro caminho). Flipar exigiria o MCP
deploy_edge_function subindo TODOS os arquivos (render importa vários `_shared`) — inviável/arriscado.

## Fix (client-side, robusto)
render-asset EXIGE JWT mas NÃO precisa da identidade do usuário (usa service role por dentro). Então o
browser passa a autorizá-lo com a **anon key** (pública, nunca expira), não com o token de sessão:
- `supabase.js`: exporta `supabaseAnonKey` (a key resolvida).
- `premiumData.js` (`invokeRenderAssetChunk`): `invoke('render-asset', { headers:{ Authorization:
  Bearer <anonKey> }, body })`. É o mesmo que o harness sempre fez.

## Verificação
Probe: render-asset via anon → **HTTP 546** (transiente de recurso do worker, retentado com sucesso — os
9 assets checklist-rail da Flow MGF estão `generated`), **não 401**. lint + build OK. As demais Edges
gated (IA/Meta) seguem exigindo login (correto). Cliente vai ao ar no rebuild da Hostinger.

## Notas
- Os 13 assets em fila da Flow MGF são `premium-*` (conteúdo: carousel/reels/whatsapp/email) — render-asset
  responde 200 "nenhum asset queued" (não são cortes de tráfego); não é erro.
- Débito: `render-asset verify_jwt` continua true (CLI não flipa). Não é problema com a anon key, mas vale
  revisitar (cron/reaper deve usar service role, que é isento). [[deploy-hostinger-vitrapremium]]
[[render-asset-deploy-e-limites]]
