# Fix "Importar do link" em produção (HTTP 404) — Edge fetch-listing-text (2026-07-03)

## Sintoma (reportado no site publicado)
Tráfego Pago → Nova campanha → "Buscar do link"/"Extrair e gerar copy" retornava **"Falha ao ler a
página: HTTP 404."**

## Causa-raiz
`fetchListingText` (premiumData.js) fazia `POST /api/fetch-listing-text` — um **middleware do dev-server
do Vite** (`vite.config.js`, `configureServer`), que **só existe em `npm run dev`**. No site estático da
Hostinger a rota não existe → o host devolve **404**. O próprio código admitia: "disponível apenas no app
(npm run dev)". Ou seja: a importação por link **nunca** funcionou em produção (limitação arquitetural:
SPA estática não tem servidor). Não era o link `moveup.imb.br` (que retorna 200 com texto).

## Fix (mover a busca para o backend que existe em prod)
- **Nova Edge `fetch-listing-text`** (Deno, self-contained): SSRF (bloqueia local/privado/metadata +
  revalida destino pós-redirect), timeout 8s, teto 5MB, `htmlToReadableText` PORTADO de listingText.js,
  fallback opcional ao render-worker headless (só se WORKER_RENDER_URL/TOKEN nos secrets). Falha SEMPRE
  graciosa → `200 { text, warnings }` (cai para colar). Sem chave de IA (não chama Anthropic) → não exige
  o gate; protegido por SSRF + apikey. `config.toml`: verify_jwt=false.
- **Cliente:** `fetchListingText` agora usa `supabase.functions.invoke('fetch-listing-text')` +
  `copilotGateHeaders()`; removido o guard "só dev". Erro via `edgeError` (lança o Error direto).

## Verificação (edge deployado, testado ao vivo)
- Link real do print → **200, 3561 chars** extraídos (server-rendered).
- `localhost` e `169.254.169.254` (metadata) → **bloqueados** com aviso de segurança.
- vazio → aviso "Cole o link". 238 testes + lint + deno check OK; build do dashboard OK; deploy CLI.

## Para a correção chegar ao ar
Precisa do **rebuild do dashboard na Hostinger** (o cliente novo chama o edge; o edge já está no ar).
Push na main → Hostinger rebuilda. DEPLOY.md atualizado (seção 6).

## Pendências
- Sites SPA/JS ainda voltam pouco texto (worker dormente) → cai para colar. Ativar o worker cobre.
- Middleware `/api/fetch-listing-text` do vite.config virou **código morto** (cliente não chama mais);
  os de `convert-heic`/`ingest-source-images` seguem em uso no dev. Remoção opcional (evita drift).
[[deploy-hostinger-vitrapremium]] [[render-asset-deploy-e-limites]]
