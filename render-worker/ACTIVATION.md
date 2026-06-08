# Ativação do render-worker — runbook

Ativar o worker entrega **3 coisas de uma vez**:
1. **render-worker** rodando (Chrome headless num servidor).
2. **9:16 Premium em full-res real (1080×1920)** — que o satori da Edge não aguenta (OOM).
3. **v2 do "importar do link"** — sites em JavaScript/SPA passam a ser lidos (Chrome renderiza o JS).

O código já está todo pronto. A **única etapa que é sua** é hospedar o Chrome (a máquina/conta é sua).
Sem ativar, nada disso liga e o resto do app segue normal (worker ocioso; 9:16 fica na Edge; link só
server-rendered).

---

## Pré-requisitos
- Conta no **Fly.io** (ou Railway/Render — o `fly.toml`+`Dockerfile` já miram Fly) e o `flyctl` instalado.
- A **service role key** do Supabase (NUNCA versionar) e um **RENDER_TOKEN** forte que você escolhe.

## Passo 1 — Hospedar o worker (Fly)
```bash
cd render-worker
fly launch --no-deploy            # cria o app reusando o fly.toml (app = vitra-render-worker)
fly secrets set \
  SUPABASE_SERVICE_ROLE_KEY="<service_role_key>" \
  RENDER_TOKEN="<token_forte_que_voce_escolher>"
fly deploy
```
Confira que subiu:
```bash
curl https://vitra-render-worker.fly.dev/healthz     # -> {"ok":true}
```
> Alternativa barata (sem instância always-on): `min_machines_running = 0` no fly.toml + disparar
> `POST /render` (com x-render-token) por cron externo. Para o **v2 do link** funcionar, porém, o
> worker precisa estar **no ar quando o operador clica** — então o always-on (padrão) é o recomendado.

## Passo 2 — Ligar o v2 do "importar do link" (dashboard)
No `dashboard/.env` (gitignored), aponte para o worker:
```
WORKER_RENDER_URL=https://vitra-render-worker.fly.dev
WORKER_RENDER_TOKEN=<o_mesmo_RENDER_TOKEN_do_passo_1>
```
Reinicie o `npm run dev`. Pronto: quando o fetch simples voltar pouco texto (site SPA), o middleware
chama o worker para renderizar. Sem essas duas variáveis, o import por link continua só server-rendered.

## Passo 3 — Ligar o 9:16 Premium full-res
1. No `dashboard/.env`: `VITE_WORKER_RENDER_9X16=true` (faz os novos Premium 9:16 nascerem com
   `metadata.render_engine='worker'`). Reinicie o `npm run dev`.
2. Aplique a migration de partição (espelha do lado da Edge a exclusão do conjunto-worker, evitando
   render duplicado/corrida):
   `supabase/migration-render-queue-worker-route.sql` — via SQL editor do Supabase ou `apply_migration`.
   > Ordem importa: **só aplique a migration DEPOIS** do worker no ar + a flag ligada (senão os 9:16
   > Premium flagueados ficariam `queued` sem ninguém renderizando). A migration é no-op enquanto não
   > houver assets `render_engine='worker'`.
3. (Opcional) Backfill dos Premium 9:16 já existentes para o worker: o `UPDATE` comentado no fim da
   migration.

## Verificação
- **9:16**: crie uma campanha Premium, gere; os 9:16 saem 1080×1920 (o worker os reivindica; os logs
  do worker mostram `[lote]`). 1:1 e 1.91:1 continuam na Edge.
- **v2 link**: cole o link de um imóvel num site SPA e clique "Buscar do link" — a caixa deve encher
  (antes voltava "pouco texto"). Os logs do worker mostram a chamada a `/fetch-text`.

## Desligar / rollback
- v2 link: remova `WORKER_RENDER_URL`/`WORKER_RENDER_TOKEN` do `.env` (volta ao fetch simples).
- 9:16: `VITE_WORKER_RENDER_9X16=false` (novos 9:16 voltam pra Edge). A migration pode ficar (é no-op
  sem assets do worker). Para parar o worker: `fly scale count 0` (ou apague o app).

## Segurança
- `/render` e `/fetch-text` exigem o header `x-render-token` = `RENDER_TOKEN`. **Defina um token forte.**
- `/fetch-text` renderiza URL arbitrária num Chrome real (executa JS de terceiros). Há guard de SSRF
  (bloqueia local/privado/metadata, revalida pós-redirect), mas mantenha o worker **isolado** (container
  Fly) e o token secreto. A service role key fica só no worker (server-side), nunca no front.
